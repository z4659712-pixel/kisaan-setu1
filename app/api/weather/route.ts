import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

// GET /api/weather?latitude=26.52&longitude=88.72
// Uses Open-Meteo when no OpenWeather key is configured. Check provider terms before production use.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = schema.safeParse({
    latitude: searchParams.get("latitude"),
    longitude: searchParams.get("longitude"),
  });
  if (!parsed.success) return jsonError("Valid latitude and longitude query parameters are required.");

  try {
    const { latitude, longitude } = parsed.data;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
      const url = new URL("https://api.openweathermap.org/data/2.5/forecast");
      url.searchParams.set("lat", String(latitude));
      url.searchParams.set("lon", String(longitude));
      url.searchParams.set("appid", apiKey);
      url.searchParams.set("units", "metric");
      const res = await fetch(url, { next: { revalidate: 1800 } });
      if (!res.ok) return jsonError("Weather provider request failed.", 502);
      return NextResponse.json({ source: "OpenWeather", data: await res.json() });
    }

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max");
    url.searchParams.set("timezone", "auto");
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return jsonError("Weather provider request failed.", 502);
    return NextResponse.json({ source: "Open-Meteo", data: await res.json() });
  } catch {
    return jsonError("Could not retrieve weather information.", 502);
  }
}
