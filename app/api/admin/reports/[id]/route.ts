import { ApiError, handleError, ok, parseBody } from "@/lib/server/api";
import { requireAdmin, writeAudit } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminReportResolveSchema } from "@/lib/server/schemas";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/reports — antrean laporan (filter ?status=open). */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const status = new URL(req.url).searchParams.get("status");

    let q = createAdminClient()
      .from("reports")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);
    if (status)
      q = q.eq(
        "status",
        status as "open" | "reviewing" | "resolved" | "dismissed",
      );

    const { data, error } = await q;
    if (error) throw error;
    return ok({ items: data ?? [] });
  } catch (e) {
    return handleError(e);
  }
}

/** PATCH /api/admin/reports/[id] — review/resolve/tindak lanjut (PRD §43-44). */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await ctx.params;
    const body = await parseBody(req, adminReportResolveSchema);

    const { data, error } = await createAdminClient()
      .from("reports")
      .update({
        status: body.status,
        resolution_note: body.resolution_note ?? null,
        resolved_at:
          body.status === "resolved" || body.status === "dismissed"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", id)
      .select("id,status")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, "report tidak ditemukan");

    await writeAudit(admin.id, `report.${body.status}`, "report", id, {
      note: body.resolution_note ?? null,
    });

    return ok(data);
  } catch (e) {
    return handleError(e);
  }
}
