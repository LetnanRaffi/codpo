import { handleError, ok } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { userClient } from "@/lib/server/user-client";
import { createAdminClient } from "@/lib/supabase/admin";

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
        "id,status,agreed_price,created_at,completed_at,listing_id,buyer_id,seller_id,cod_sessions(id,state,scheduled_at,meeting_point)",
      )
      .eq(role === "seller" ? "seller_id" : "buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    const rows = data ?? [];
    const listingIds = [...new Set(rows.map((row) => row.listing_id))];
    const otherIds = [
      ...new Set(
        rows.map((row) => (role === "seller" ? row.buyer_id : row.seller_id)),
      ),
    ];
    const admin = createAdminClient();
    const [{ data: listings }, { data: profiles }] = await Promise.all([
      listingIds.length
        ? admin.from("listings").select("id,title").in("id", listingIds)
        : Promise.resolve({ data: [] }),
      otherIds.length
        ? db.from("profiles").select("id,name").in("id", otherIds)
        : Promise.resolve({ data: [] }),
    ]);
    const titles = new Map(
      (listings ?? []).map((item) => [item.id, item.title]),
    );
    const names = new Map((profiles ?? []).map((item) => [item.id, item.name]));
    return ok({
      items: rows.map((row) => ({
        ...row,
        listing_title: titles.get(row.listing_id) ?? "Listing",
        other_user_name:
          names.get(role === "seller" ? row.buyer_id : row.seller_id) ??
          "Pengguna",
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}
