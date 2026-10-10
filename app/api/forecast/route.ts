import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  crop: z.string().trim().min(1).max(80),
  district: z.string().trim().min(1).max(100),
  horizon_days: z.number().int().min(1).max(30).default(7),
});

// POST /api/forecast
// Proxies to a separately deployed Python service. No prediction is fabricated if it is not configured.
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Request body must be valid JSON."); }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return jsonError("Provide crop, district, and a horizon_days value from 1 to 30.");

  const baseUrl = process.env.ML_API_URL;
  if (!baseUrl) {
    return NextResponse.json({
      error: "Forecast service is not configured yet.",
      next_step: "Deploy the Python/XGBoost API, then set ML_API_URL in Vercel environment variables.",
      input: parsed.data,
    }, { status: 503 });
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/predict/price`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.ML_API_SECRET ? { "x-api-key": process.env.ML_API_SECRET } : {}),
      },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) return jsonError("The forecasting service returned an error.", 502);
    return NextResponse.json({ data: result, source: "python-ml-service" });
  } catch {
    return jsonError("The forecasting service could not be reached.", 502);
  }
}
