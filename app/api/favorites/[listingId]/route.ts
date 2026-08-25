import { ApiError, handleError, ok } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { userClient } from "@/lib/server/user-client";

type Ctx = { params: Promise<{ listingId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser(req);
    const { listingId } = await ctx.params;
    const db = userClient(req);
    const { data: listing } = await db
      .from("listing_public")
      .select("id")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing) throw new ApiError(404, "listing tidak ditemukan");
    const { error } = await db
      .from("favorites")
      .upsert(
        { user_id: user.id, listing_id: listingId },
        { onConflict: "user_id,listing_id", ignoreDuplicates: true },
      );
    if (error) throw error;
    return ok({ favorited: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser(req);
    const { listingId } = await ctx.params;
    const { error } = await userClient(req)
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);
    if (error) throw error;
    return ok({ favorited: false });
  } catch (error) {
    return handleError(error);
  }
}
