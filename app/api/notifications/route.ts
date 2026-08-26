import { handleError, ok } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET /api/notifications — notifikasi in-app saya (PRD §42). */
export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const unreadOnly = new URL(req.url).searchParams.get("unread") === "true";

    let q = createAdminClient()
      .from("notifications")
      .select("id,type,title,body,data,read_at,created_at")
      .eq("user_id", user.id);

    if (unreadOnly) q = q.is("read_at", null);

    const [itemsResult, countResult] = await Promise.all([
      q.order("created_at", { ascending: false }).limit(50),
      createAdminClient()
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
    ]);
    if (itemsResult.error) throw itemsResult.error;
    if (countResult.error) throw countResult.error;

    return ok({
      items: itemsResult.data ?? [],
      unread_count: countResult.count ?? 0,
    });
  } catch (e) {
    return handleError(e);
  }
}
