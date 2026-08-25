import { handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { codRequestDecisionSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/cod/requests/[id] — keputusan SELLER (PRD §27):
 * accept → buat session+transaction atomik (RPC)
 * reject / counter (usul jadwal & titik temu lain).
 */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    rateLimit(req, "cod-decide", 30, 60 * 1000);
    await requireUser(req);
    const { id } = await ctx.params;
    const body = await parseBody(req, codRequestDecisionSchema);
    const db = userClient(req);

    switch (body.action) {
      case "accept": {
        const { data, error } = await db.rpc("accept_cod_request", {
          p_request_id: id,
        });
        if (error) throw error;
        return ok({ session_id: data });
      }
      case "reject": {
        const { error } = await db.rpc("reject_cod_request", {
          p_request_id: id,
        });
        if (error) throw error;
        return ok({ rejected: true });
      }
      case "counter": {
        const { error } = await db.rpc("counter_cod_request", {
          p_request_id: id,
          p_date: body.counter_date,
          p_time: body.counter_time,
          p_point: body.counter_meeting_point,
        });
        if (error) throw error;
        return ok({ countered: true });
      }
    }
  } catch (e) {
    return handleError(e);
  }
}
