import { handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { boostPurchaseSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/listings/[id]/boost — beli boost untuk listing milik sendiri (PRD §39).
 *
 * PAYMENT GATEWAY: BELUM diputuskan (Midtrans/Xendit kandidat) → pembayaran
 * disimulasikan langsung 'paid' + harga di-snapshot. Rows listing_boosts tetap
 * tersimpan; swap ke gateway nanti cukup ganti flow jadi pending→webhook→paid.
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    rateLimit(req, "boost-buy", 10, 60 * 60 * 1000);
    await requireUser(req);
    const { id } = await ctx.params;
    const body = await parseBody(req, boostPurchaseSchema);

    const { data, error } = await userClient(req).rpc("purchase_boost", {
      p_listing_id: id,
      p_product_code: body.product_code,
    });
    if (error) throw error;

    return ok({ boost_id: data });
  } catch (e) {
    return handleError(e);
  }
}
