import { handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { reportCreateSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

/** POST /api/reports — lapor konten/user (PRD §44). Rate-limited anti spam. */
export async function POST(req: Request) {
  try {
    rateLimit(req, "report", 5, 60 * 60 * 1000);
    const user = await requireUser(req);
    const body = await parseBody(req, reportCreateSchema);

    const { data, error } = await userClient(req)
      .from("reports")
      .insert({
        reporter_id: user.id,
        target_type: body.target_type,
        target_id: body.target_id,
        reason: body.reason,
        description: body.description ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;

    return ok({ report_id: data.id }, 201);
  } catch (e) {
    return handleError(e);
  }
}
