import { ApiError, handleError, ok, parseBody } from "@/lib/server/api";
import { requireAdmin, writeAudit } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminBoostProductPatchSchema } from "@/lib/server/schemas";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ code: string }> };

/**
 * PATCH /api/admin/boost/products/[code] — ubah harga / aktif-nonaktif (PRD §39).
 * Harga boost dikonfigurasi admin, bukan hardcode.
 */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin(req);
    const { code } = await ctx.params;
    const body = await parseBody(req, adminBoostProductPatchSchema);

    const payload: Record<string, unknown> = {};
    if (body.price_idr !== undefined) payload.price_idr = body.price_idr;
    if (body.active !== undefined) payload.active = body.active;
    if (body.duration_hours !== undefined)
      payload.duration_hours = body.duration_hours;

    const { data, error } = await createAdminClient()
      .from("boost_products")
      .update(payload)
      .eq("code", code)
      .select("code,name,price_idr,active,duration_hours")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(404, "produk boost tidak ditemukan");

    await writeAudit(admin.id, "boost_product.update", "boost_product", code, {
      ...payload,
    });

    return ok(data);
  } catch (e) {
    return handleError(e);
  }
}
