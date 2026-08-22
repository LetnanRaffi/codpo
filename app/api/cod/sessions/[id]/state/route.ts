import { handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { codStateSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/cod/sessions/[id]/state — transisi state machine (PRD §29).
 * Validasi transisi + role rules dijalankan di DB function cod_transition:
 * invalid jump ditolak, item_check/completed hanya buyer.
 * Trigger DB ikut mensinkronkan transactions.status & listing sold + notifications.
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    await requireUser(req);
    const { id } = await ctx.params;
    const body = await parseBody(req, codStateSchema);

    const { data, error } = await userClient(req).rpc("cod_transition", {
      p_session_id: id,
      p_target: body.state,
    });
    if (error) throw error;

    return ok({ state: data });
  } catch (e) {
    return handleError(e);
  }
}
