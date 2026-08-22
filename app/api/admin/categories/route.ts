import { handleError, ok, parseBody } from "@/lib/server/api";
import { requireAdmin, writeAudit } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminCategoryUpsertSchema } from "@/lib/server/schemas";

export const dynamic = "force-dynamic";

/** GET /api/admin/categories — semua kategori termasuk nonaktif. */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { data, error } = await createAdminClient()
      .from("categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return ok({ items: data ?? [] });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/admin/categories — create/update-by-slug (PRD §43) + audit. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await parseBody(req, adminCategoryUpsertSchema);

    const { data, error } = await createAdminClient()
      .from("categories")
      .upsert(body, { onConflict: "slug" })
      .select("id,slug,name")
      .single();
    if (error) throw error;

    await writeAudit(admin.id, "category.upsert", "category", data.slug, {
      name: body.name,
      active: body.active,
    });

    return ok(data, 201);
  } catch (e) {
    return handleError(e);
  }
}
