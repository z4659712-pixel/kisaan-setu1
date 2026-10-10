import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/market-prices?crop=Potato&district=Jalpaiguri
// Only reads records entered/imported into your Supabase database.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const crop = searchParams.get("crop");
    const district = searchParams.get("district");
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("market_prices")
      .select("id,crop,market_name,district,state,price_per_quintal,arrival_volume,quality_grade,observed_on,source")
      .order("observed_on", { ascending: false })
      .limit(limit);

    if (crop) query = query.ilike("crop", crop);
    if (district) query = query.ilike("district", district);

    const { data, error } = await query;
    if (error) return jsonError("Could not load market prices. Check your Supabase schema and environment variables.", 500);

    return NextResponse.json({ data: data ?? [], count: data?.length ?? 0, note: "Only database records are returned; an empty list means no data has been imported yet." });
  } catch {
    return jsonError("Server configuration error.", 500);
  }
}
