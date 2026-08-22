import { handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { reviewCreateSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

/** POST /api/reviews — rating 1-5 setelah transaksi COMPLETED (PRD §36).
 * RLS + trigger DB memvalidasi: reviewer pihak transaksi, belum pernah review,
 * reviewee lawan transaksi. Duplicate → 409 dari unique index.
 */
export async function POST(req: Request) {
  try {
    rateLimit(req, "review", 10, 60 * 60 * 1000);
    const user = await requireUser(req);
    const body = await parseBody(req, reviewCreateSchema);
    const db = userClient(req);

    // Tentukan reviewee dari transaksi (server-side, bukan dari payload).
    const { data: trx } = await db
      .from("transactions")
      .select("buyer_id,seller_id,status")
      .eq("id", body.transaction_id)
      .single();
    if (!trx || trx.status !== "completed") {
      return ok({ error: "transaksi tidak ditemukan / belum selesai" }, 404);
    }
    const reviewee =
      trx.buyer_id === user.id
        ? trx.seller_id
        : trx.seller_id === user.id
          ? trx.buyer_id
          : null;
    if (!reviewee) return ok({ error: "kamu bukan pihak transaksi ini" }, 403);

    const { data, error } = await db
      .from("reviews")
      .insert({
        transaction_id: body.transaction_id,
        reviewer_id: user.id,
        reviewee_id: reviewee,
        rating: body.rating,
        body: body.body ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;

    return ok({ review_id: data.id }, 201);
  } catch (e) {
    return handleError(e);
  }
}

/** GET /api/reviews?reviewee_id=... — ulasan publik untuk profil seller (PRD §23). */
export async function GET(req: Request) {
  try {
    const revieweeId = new URL(req.url).searchParams.get("reviewee_id");
    if (!revieweeId) return ok({ items: [] });

    const { data, error } = await userClient(req)
      .from("reviews")
      .select("rating,body,created_at,reviewer_id")
      .eq("reviewee_id", revieweeId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    return ok({ items: data ?? [] });
  } catch (e) {
    return handleError(e);
  }
}
