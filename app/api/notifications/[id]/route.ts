import { handleError, ok } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/notifications/[id] — tandai dibaca (scoped ke pemilik). */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser(req);
    const body = (await req.json().catch(() => ({}))) as { read?: boolean };
    if (body.read !== true) {
      return ok({ error: "body harus {read:true}" }, 422);
    }
    const { id } = await ctx.params;

    const { error } = await createAdminClient()
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", Number(id))
      .eq("user_id", user.id); // scope eksplisit — gak bisa tandain punya orang
    if (error) throw error;

    return ok({ read: true });
  } catch (e) {
    return handleError(e);
  }
}
