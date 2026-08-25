import { handleError, ok } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { data, error } = await createAdminClient()
      .from("boost_products")
      .select("code,name,duration_hours,price_idr,active")
      .order("price_idr");
    if (error) throw error;
    return ok({ items: data ?? [] });
  } catch (error) {
    return handleError(error);
  }
}
