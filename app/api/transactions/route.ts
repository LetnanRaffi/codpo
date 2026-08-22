import { handleError, ok } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

/** GET /api/transactions — transaksi saya sebagai buyer/seller (PRD §35). */
export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const role =
      new URL(req.url).searchParams.get("role") === "seller"
        ? "seller"
        : "buyer";
    const db = userClient(req);

    const { data, error } = await db
      .from("transactions")
      .select(
        "id,status,agreed_price,created_at,completed_at,listing_id,buyer_id,seller_id,cod_sessions(state,scheduled_at,meeting_point)",
      )
      .eq(role === "seller" ? "seller_id" : "buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    return ok({ items: data ?? [] });
  } catch (e) {
    return handleError(e);
  }
}
