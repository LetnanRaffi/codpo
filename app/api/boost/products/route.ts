import { handleError, ok } from "@/lib/server/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 0;

/** GET /api/boost/products — katalog boost aktif (publik, PRD §39). */
export async function GET() {
  try {
    const { data, error } = await createAdminClient()
      .from("boost_products")
      .select("code,name,duration_hours,price_idr")
      .eq("active", true)
      .order("price_idr");
    if (error) throw error;

    return ok({ items: data ?? [] });
  } catch (e) {
    return handleError(e);
  }
}
