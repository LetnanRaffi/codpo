import { ApiError, handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { conversationOpenSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

/** GET /api/conversations — inbox saya (PRD §24). */
export async function GET(req: Request) {
  try {
    await requireUser(req);
    const db = userClient(req);

    const { data: items, error } = await db.rpc("get_conversation_inbox");
    if (error) throw error;
    return ok({ items: items ?? [] });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/conversations — buka/find-or-create chat untuk sebuah listing (PRD §24). */
export async function POST(req: Request) {
  try {
    rateLimit(req, "conv-open", 20, 60 * 1000);
    await requireUser(req);
    const body = await parseBody(req, conversationOpenSchema);

    const { data, error } = await userClient(req).rpc("open_conversation", {
      p_listing_id: body.listing_id,
    });
    if (error) throw error;
    if (!data) throw new ApiError(500, "gagal membuka percakapan");

    return ok({ conversation_id: data }, 201);
  } catch (e) {
    return handleError(e);
  }
}
