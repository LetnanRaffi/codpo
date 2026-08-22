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

    const { data: session } = await db
      .from("cod_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!session)
      throw new ApiError(404, "sesi tidak ditemukan / bukan peserta");

    const { data: locations } = await db
      .from("cod_locations")
      .select("user_id,geom,accuracy_m,recorded_at")
      .eq("session_id", id)
      .order("recorded_at", { ascending: false })
      .limit(40);

    return ok({
      session,
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
