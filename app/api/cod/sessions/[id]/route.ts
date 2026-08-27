import { ApiError, handleError, ok } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/cod/sessions/[id] — detail sesi + jejak titik lokasi terakhir
 * kedua pihak (participant-only via RLS, PRD §30-31).
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireUser(req);
    const { id } = await ctx.params;
    const db = userClient(req);

    const { data: session, error: sessionError } = await db
      .from("cod_session_map")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session)
      throw new ApiError(404, "sesi tidak ditemukan / bukan peserta");

    const [{ data: locations, error: locationsError }, { data: sharing, error: sharingError }] = await Promise.all([
      db
        .from("cod_location_points")
        .select("id,user_id,lat,lng,accuracy_m,recorded_at")
        .eq("session_id", id)
        .order("recorded_at", { ascending: false })
        .limit(40),
      db
        .from("cod_location_sharing")
        .select("user_id,enabled,started_at,updated_at")
        .eq("session_id", id),
    ]);
    if (locationsError) throw locationsError;
    if (sharingError) throw sharingError;

    return ok({
      session,
      sharing: sharing ?? [],
      // Titik terakhir per user untuk map; histori dibatasi oleh purge job.
      latest_locations: Object.values(
        (locations ?? []).reduce<Record<string, unknown>>((acc, l) => {
          if (!acc[l.user_id]) acc[l.user_id] = l;
          return acc;
        }, {}),
      ),
    });
  } catch (e) {
    return handleError(e);
  }
}
