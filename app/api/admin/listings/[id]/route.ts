import { ApiError, handleError, ok } from "@/lib/server/api";
import { requireAdmin, writeAudit } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminListingModerateSchema } from "@/lib/server/schemas";
import { parseBody } from "@/lib/server/api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/listings/[id] — remove/restore listing (PRD §43). */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await ctx.params;
    const body = await parseBody(req, adminListingModerateSchema);

    // removed = hilang dari marketplace; restore → active lagi.
    const { data, error } = await createAdminClient()
      .from("listings")
      .update({
        status: body.action === "remove" ? "removed" : "active",
      })
      .eq("id", id)
      .select("id,status")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, "listing tidak ditemukan");

    await writeAudit(admin.id, `listing.${body.action}`, "listing", id, {
      note: body.note ?? null,
    });

    return ok(data);
  } catch (e) {
    return handleError(e);
  }
}
