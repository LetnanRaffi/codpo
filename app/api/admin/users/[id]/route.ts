import { ApiError, handleError, ok } from "@/lib/server/api";
import { requireAdmin, writeAudit } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action: z.enum(["suspend", "ban", "restore"]),
  note: z.string().max(300).optional(),
});

/** PATCH /api/admin/users/[id] — suspend/ban/restore (PRD §38/§43) + audit. */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(422, "action tidak valid");
    if (id === admin.id)
      throw new ApiError(400, "gak bisa menindak diri sendiri");

    const status =
      parsed.data.action === "suspend"
        ? "suspended"
        : parsed.data.action === "ban"
          ? "banned"
          : "active";

    const { error } = await createAdminClient()
      .from("profiles")
      .update({ status, status_note: parsed.data.note ?? null })
      .eq("id", id);
    if (error) throw error;

    // Suspend/ban mematikan sesi aktif target (defense-in-depth).
    if (status !== "active") {
      void createAdminClient().auth.admin.signOut(id);
    }

    await writeAudit(admin.id, `user.${parsed.data.action}`, "user", id, {
      note: parsed.data.note ?? null,
    });

    return ok({ user_id: id, status });
  } catch (e) {
    return handleError(e);
  }
}

/** GET /api/admin/users/[id] — profil lengkap untuk review admin. */
export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const adminDb = createAdminClient();

    const [{ data: profile }, { data: reputation }] = await Promise.all([
      adminDb.from("profiles").select("*").eq("id", id).maybeSingle(),
      adminDb
        .from("user_reputation")
        .select("*")
        .eq("user_id", id)
        .maybeSingle(),
    ]);
    if (!profile) throw new ApiError(404, "user tidak ditemukan");

    return ok({ profile, reputation });
  } catch (e) {
    return handleError(e);
  }
}
