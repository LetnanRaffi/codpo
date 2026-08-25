import { ApiError, handleError, ok, parseBody } from "@/lib/server/api";
import { optionalUser, requireUser } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listingUpdateSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/listings/[id] — detail publik (koordinat dibulatkan ~110m, PRD §13). */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const db = userClient(req);

    let { data: listing } = await db
      .from("listing_public")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    let authorizedSold = false;
    if (!listing) {
      const user = await optionalUser(req);
      if (user) {
        const admin = createAdminClient();
        const [{ data: raw }, { data: transaction }] = await Promise.all([
          admin
            .from("listings")
            .select(
              "id,seller_id,category_id,title,description,condition,normal_price,bu_price,bu_expires_at,sale_type,status,cod_available,area_label,boosted_until,views,created_at,updated_at,categories(slug,name)",
            )
            .eq("id", id)
            .maybeSingle(),
          admin
            .from("transactions")
            .select("id")
            .eq("listing_id", id)
            .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
            .limit(1)
            .maybeSingle(),
        ]);
        if (raw && (raw.seller_id === user.id || transaction)) {
          const category = Array.isArray(raw.categories)
            ? raw.categories[0]
            : raw.categories;
          listing = {
            ...raw,
            category_slug: category?.slug ?? "lainnya",
            category_name: category?.name ?? "Lainnya",
            effective_sale_type:
              raw.sale_type === "BU" &&
              raw.bu_expires_at &&
              new Date(raw.bu_expires_at) > new Date()
                ? "BU"
                : "NORMAL",
          };
          authorizedSold = true;
        }
      }
    }
    if (!listing) throw new ApiError(404, "listing tidak ditemukan");

    const [{ data: images }, { data: rep }] = await Promise.all([
      (authorizedSold ? createAdminClient() : db)
        .from("listing_images")
        .select("object_key,position")
        .eq("listing_id", id)
        .order("position"),
      db
        .from("user_reputation")
        .select("*")
        .eq("user_id", listing.seller_id)
        .maybeSingle(),
    ]);

    // Increment atomik agar request paralel tidak saling menimpa.
    const { error: viewError } = await db.rpc("increment_listing_views", {
      p_id: id,
    });
    if (viewError) console.error("[listing.view]", viewError.message);

    return ok({
      listing,
      images: images ?? [],
      seller_reputation: rep ?? null,
    });
  } catch (e) {
    return handleError(e);
  }
}

/** PATCH /api/listings/[id] — update milik sendiri (RLS + guard trigger DB). */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireUser(req);
    const { id } = await ctx.params;
    const patch = await parseBody(req, listingUpdateSchema);
    const db = userClient(req);

    const { lat, lng, category_slug, ...rest } = patch;
    const payload: Record<string, unknown> = { ...rest };
    if (category_slug !== undefined) {
      const { data: category } = await db
        .from("categories")
        .select("id")
        .eq("slug", category_slug)
        .eq("active", true)
        .maybeSingle();
      if (!category) throw new ApiError(422, "kategori tidak ditemukan");
      payload.category_id = category.id;
    }
    if (lat !== undefined && lng !== undefined) {
      payload.geom = `SRID=4326;POINT(${lng} ${lat})`;
    }

    const { data, error } = await db
      .from("listings")
      .update(payload)
      .eq("id", id)
      .select("id,status,sale_type,bu_price,bu_expires_at")
      .maybeSingle();

    if (error) throw error;
    if (!data)
      throw new ApiError(404, "listing tidak ditemukan / bukan milikmu");

    return ok(data);
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/listings/[id] — hapus milik sendiri (diblokir kalau ada transaksi berjalan). */
export async function DELETE(req: Request, ctx: Ctx) {
  try {
    await requireUser(req);
    const { id } = await ctx.params;
    const db = userClient(req);

    const { data: deleted, error } = await db
      .from("listings")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!deleted)
      throw new ApiError(404, "listing tidak ditemukan / bukan milikmu");
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
