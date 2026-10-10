import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { bearerToken, jsonError } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const offerSchema = z.object({
  produce_listing_id: z.string().uuid(),
  offered_price_per_quintal: z.number().positive().max(10000000),
  quantity_quintals: z.number().positive().max(1000000),
  message: z.string().trim().max(1000).optional(),
});

// GET /api/buyer-offers requires Authorization: Bearer <Supabase access token>
export async function GET(request: Request) {
  const token = bearerToken(request);
  if (!token) return jsonError("Sign in first to view buyer offers.", 401);

  try {
    const supabase = createSupabaseAdminClient();
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return jsonError("Your session is invalid or expired.", 401);

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle();
    if (!profile || !["farmer", "fpo", "buyer", "admin"].includes(profile.role)) {
      return jsonError("Your account profile is missing. Create a profile first.", 403);
    }

    let query = supabase
      .from("buyer_offers")
      .select("id,produce_listing_id,buyer_id,offered_price_per_quintal,quantity_quintals,message,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (profile.role === "buyer") query = query.eq("buyer_id", auth.user.id);
    const { data, error } = await query;
    if (error) return jsonError("Could not load offers. Check the database schema.", 500);
    return NextResponse.json({ data: data ?? [] });
  } catch {
    return jsonError("Server configuration error.", 500);
  }
}

// POST /api/buyer-offers requires a signed-in buyer account.
// Buyer verification is a separate admin-controlled process; this endpoint does not self-verify buyers.
export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) return jsonError("Sign in first to submit an offer.", 401);

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("Request body must be valid JSON."); }
  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid offer details. Provide a listing UUID, positive price, and positive quantity.");

  try {
    const supabase = createSupabaseAdminClient();
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return jsonError("Your session is invalid or expired.", 401);

    const { data: profile } = await supabase.from("profiles").select("role,buyer_verified").eq("id", auth.user.id).maybeSingle();
    if (!profile || profile.role !== "buyer") return jsonError("Only buyer accounts can submit offers.", 403);
    if (!profile.buyer_verified) return jsonError("Your buyer account must be verified by an administrator before submitting offers.", 403);

    const { data: listing, error: listingError } = await supabase
      .from("produce_listings")
      .select("id,status")
      .eq("id", parsed.data.produce_listing_id)
      .maybeSingle();
    if (listingError || !listing || listing.status !== "available") return jsonError("This produce listing is unavailable.", 404);

    const { data, error } = await supabase.from("buyer_offers").insert({
      ...parsed.data,
      buyer_id: auth.user.id,
      status: "pending",
    }).select("id,produce_listing_id,buyer_id,offered_price_per_quintal,quantity_quintals,message,status,created_at").single();

    if (error) return jsonError("Could not save the offer. Check the database schema.", 500);
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return jsonError("Server configuration error.", 500);
  }
}
