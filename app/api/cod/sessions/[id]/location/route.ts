import { handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { codLocationSchema, sharingSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/cod/sessions/[id]/location — kirim posisi GPS saat COD aktif (PRD §30-31).
 * Server-side throttle (interval waktu + jarak minimum dari app_config) dan
 * MENOLAK update kalau sesi sudah selesai / sharing tidak aktif.
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    rateLimit(req, "cod-loc", 60, 60 * 1000);
    await requireUser(req);
    const { id } = await ctx.params;
    const body = await parseBody(req, codLocationSchema);

    const { data, error } = await userClient(req).rpc("post_cod_location", {
      p_session_id: id,
      p_lat: body.lat,
      p_lng: body.lng,
      p_accuracy_m: body.accuracy_m ?? null,
    });
    if (error) throw error;

    return ok({ status: data });
  } catch (e) {
    return handleError(e);
  }
}

/** PATCH — opt-in/opt-out sharing milik sendiri (PRD §31 rule #1). */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireUser(req);
    const { id } = await ctx.params;
    const body = await parseBody(req, sharingSchema);

    const { error } = await userClient(req).rpc("set_location_sharing", {
      p_session_id: id,
      p_enabled: body.enabled,
    });
    if (error) throw error;

    return ok({ enabled: body.enabled });
  } catch (e) {
    return handleError(e);
  }
}
