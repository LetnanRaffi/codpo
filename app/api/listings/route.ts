import { ApiError, handleError, ok, parseBody } from "@/lib/server/api";
import { optionalUser, requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { listingCreateSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";
import { publicObjectUrl } from "@/lib/server/marketplace";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings — pencarian publik (PRD §19-21).
 * Query: q, category_slug, condition, min_price, max_price, bu_only, cod_only,
 *        lat, lng, radius_m, sort(recommended|terdekat|terbaru|termurah|termahal), limit, offset
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const num = (k: string, min?: number, max?: number) => {
      const v = url.searchParams.get(k);
      if (v === null || v === "") return null;
      const parsed = Number(v);
      if (
        !Number.isFinite(parsed) ||
        (min !== undefined && parsed < min) ||
        (max !== undefined && parsed > max)
      ) {
        throw new ApiError(422, `parameter ${k} tidak valid`);
      }
      return parsed;
    };
    const sort = url.searchParams.get("sort") ?? "recommended";
    if (
      !["recommended", "terdekat", "terbaru", "termurah", "termahal"].includes(
        sort,
      )
    ) {
      throw new ApiError(422, "parameter sort tidak valid");
    }
    const minPrice = num("min_price", 0);
    const maxPrice = num("max_price", 0);
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      throw new ApiError(422, "harga minimum tidak boleh melebihi maksimum");
    }
    const lat = num("lat", -90, 90);
    const lng = num("lng", -180, 180);
    const radiusM = num("radius_m", 1, 1_000_000);
    const db = userClient(req); // anon tetap bisa — RPC security invoker menghormati RLS

    const { data, error } = await db.rpc("search_listings", {
      p_q: url.searchParams.get("q"),
      p_category_slug: url.searchParams.get("category_slug"),
      p_condition: url.searchParams.get("condition"),
      p_min_price: minPrice,
      p_max_price: maxPrice,
      p_bu_only: url.searchParams.get("bu_only") === "true",
      p_cod_only: url.searchParams.get("cod_only") === "true",
      p_lat: lat,
      p_lng: lng,
      p_radius_m: radiusM,
      p_sort: sort,
      p_limit: Math.min(Math.trunc(num("limit", 1, 50) ?? 24), 50),
      p_offset: Math.trunc(num("offset", 0) ?? 0),
    });
    if (error) throw error;
    const rows = (data ?? []) as Record<string, unknown>[];
    const ids = rows.map((row) => String(row.id));
    const imageMap = new Map<string, string[]>();
    if (ids.length) {
      const { data: images, error: imageError } = await db
        .from("listing_images")
        .select("listing_id,object_key,position")
        .in("listing_id", ids)
        .order("position");
      if (imageError) throw imageError;
      for (const image of images ?? []) {
        const imageUrl = publicObjectUrl(image.object_key);
        if (!imageUrl) continue;
        imageMap.set(image.listing_id, [
          ...(imageMap.get(image.listing_id) ?? []),
          imageUrl,
        ]);
      }
    }
    return ok({
      items: rows.map((row) => ({
        ...row,
        within_radius:
          row.distance_km != null &&
          (radiusM ?? Infinity) >=
            Number(row.distance_km) * 1000,
        images: imageMap.get(String(row.id)) ?? [],
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/listings — pasang listing baru (PRD §14-16). Auth wajib. */
export async function POST(req: Request) {
  try {
    rateLimit(req, "listing-create", 10, 60 * 60 * 1000);
    const user = await requireUser(req);
    const body = await parseBody(req, listingCreateSchema);
    const db = userClient(req);

    const { data: category } = await db
      .from("categories")
      .select("id")
      .eq("slug", body.category_slug)
      .eq("active", true)
      .single();
    if (!category) throw new ApiError(404, "kategori tidak ditemukan");

    const { data, error } = await db
      .from("listings")
      .insert({
        seller_id: user.id,
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
