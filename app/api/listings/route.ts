import { handleError, ok, parseBody } from "@/lib/server/api";
import { optionalUser, requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { listingCreateSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings — pencarian publik (PRD §19-21).
 * Query: q, category_slug, condition, min_price, max_price, bu_only, cod_only,
 *        lat, lng, radius_m, sort(recommended|terdekat|terbaru|termurah|termahal), limit, offset
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const num = (k: string) => {
      const v = url.searchParams.get(k);
      return v === null || v === "" ? null : Number(v);
    };
    const db = userClient(req); // anon tetap bisa — RPC security invoker menghormati RLS

    const { data, error } = await db.rpc("search_listings", {
      p_q: url.searchParams.get("q"),
      p_category_slug: url.searchParams.get("category_slug"),
      p_condition: url.searchParams.get("condition"),
      p_min_price: num("min_price"),
      p_max_price: num("max_price"),
      p_bu_only: url.searchParams.get("bu_only") === "true",
      p_cod_only: url.searchParams.get("cod_only") === "true",
      p_lat: num("lat"),
      p_lng: num("lng"),
      p_radius_m: num("radius_m"),
      p_sort: url.searchParams.get("sort") ?? "recommended",
      p_limit: Math.min(Number(num("limit") ?? 24), 50),
      p_offset: Math.max(Number(num("offset") ?? 0), 0),
    });
    if (error) throw error;
    return ok({ items: data ?? [] });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/listings — pasang listing baru (PRD §14-16). Auth wajib. */
export async function POST(req: Request) {
  try {
    rateLimit(req, "listing-create", 10, 60 * 60 * 1000);
    await requireUser(req);
    const body = await parseBody(req, listingCreateSchema);
    const db = userClient(req);

    const { data: category } = await db
      .from("categories")
      .select("id")
      .eq("slug", body.category_slug)
      .eq("active", true)
      .single();
    if (!category) return ok({ error: "kategori tidak ditemukan" }, 404);

    const { data, error } = await db
      .from("listings")
      .insert({
        category_id: category.id,
        title: body.title,
        description: body.description,
        condition: body.condition,
        normal_price: body.normal_price,
        bu_price: body.bu_price ?? null,
        bu_expires_at: body.bu_expires_at ?? null,
        sale_type: body.sale_type,
        cod_available: body.cod_available,
        area_label: body.area_label,
        geom: `SRID=4326;POINT(${body.lng} ${body.lat})`,
      })
      .select("id")
      .single();
    if (error) throw error;

    return ok({ id: data.id }, 201);
  } catch (e) {
    return handleError(e);
  }
}

// optionalUser dipakai route lain untuk personalisasi; ekspor helper agar tree-shake konsisten.
export const runtime = "nodejs";
void optionalUser;
