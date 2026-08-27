import { ApiError, handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { codRequestCreateSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

/**
 * POST /api/cod/requests — buyer mengajukan COD (PRD §27).
 * Server-side check eksplisit: listing aktif + COD tersedia + seller bukan diri sendiri.
 * RLS memvalidasi ulang di DB (defense-in-depth).
 */
export async function POST(req: Request) {
  try {
    rateLimit(req, "cod-request", 10, 60 * 60 * 1000);
    const user = await requireUser(req);
    const body = await parseBody(req, codRequestCreateSchema);
    const db = userClient(req);

    const { data: listing } = await db
      .from("listings")
      .select("seller_id,cod_available,status")
      .eq("id", body.listing_id)
      .single();
    if (!listing || listing.status !== "active") {
      throw new ApiError(404, "listing tidak ditemukan / tidak aktif");
    }
    if (!listing.cod_available) {
      throw new ApiError(409, "listing ini tidak menerima COD sekarang");
    }
    if (listing.seller_id === user.id) {
      throw new ApiError(400, "tidak bisa COD barang sendiri");
    }

    const { data, error } = await db
      .from("cod_requests")
      .insert({
        listing_id: body.listing_id,
        conversation_id: body.conversation_id ?? null,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        preferred_date: body.preferred_date,
        preferred_time: body.preferred_time,
        meeting_point: body.meeting_point,
        meeting_geom: `SRID=4326;POINT(${body.meeting_lng} ${body.meeting_lat})`,
        note: body.note ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;

    return ok({ request_id: data.id }, 201);
  } catch (e) {
    return handleError(e);
  }
}

/** GET /api/cod/requests?role=buyer|seller — daftar request yang melibatkan saya. */
export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const role =
      new URL(req.url).searchParams.get("role") === "seller"
        ? "seller"
        : "buyer";
    const db = userClient(req);

    const { data, error } = await db
      .from("cod_requests")
      .select("*")
      .eq(role === "seller" ? "seller_id" : "buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return ok({ items: data ?? [] });
  } catch (e) {
    return handleError(e);
  }
}
