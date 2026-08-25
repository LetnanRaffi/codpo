import { ApiError, handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/ratelimit";
import { conversationOpenSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";

/** GET /api/conversations — inbox saya (PRD §24). */
export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const db = userClient(req);

    const { data: convs, error } = await db
      .from("conversations")
      .select(
        "id,listing_id,buyer_id,seller_id,last_message_at,created_at,listings(title)",
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) throw error;

    // Lengkapi dengan judul listing + nama lawan bicara.
    const items = await Promise.all(
      (convs ?? []).map(async (c) => {
        const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
        const [{ data: other }, { data: latest }] = await Promise.all([
          db.from("profiles").select("name").eq("id", otherId).maybeSingle(),
          db
            .from("messages")
            .select("body,type")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        return {
          ...c,
          other_user_name: other?.name ?? "Pengguna",
          last_message: latest?.body || (latest?.type ? "Lampiran" : ""),
          unread_count: 0,
        };
      }),
    );

    return ok({ items });
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
