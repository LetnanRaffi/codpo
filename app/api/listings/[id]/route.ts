import { ApiError, handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
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

    const { data: listing } = await db
      .from("listing_public")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!listing) throw new ApiError(404, "listing tidak ditemukan");

    const [{ data: images }, { data: rep }] = await Promise.all([
      db
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

    // views += 1 via service role (kolom views di-guard dari owner update)
    void createAdminClient()
      .from("listings")
      .update({ views: listing.views + 1 })
      .eq("id", id)
      .then(
        () => {},
        () => {},
      );

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

    const { lat, lng, ...rest } = patch;
    const payload: Record<string, unknown> = { ...rest };
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

    const { error } = await db.from("listings").delete().eq("id", id);
    if (error) throw error;
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
