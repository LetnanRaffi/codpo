import { ApiError, handleError, ok, parseBody } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { messageSendSchema } from "@/lib/server/schemas";
import { userClient } from "@/lib/server/user-client";
import { rateLimit } from "@/lib/server/ratelimit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/conversations/[id]/messages — participant-only via RLS (PRD §26). */
export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireUser(req);
    const { id } = await ctx.params;
    const db = userClient(req);

    // Akses ditolak otomatis oleh RLS kalau bukan participant.
    const { data, error } = await db
      .from("messages")
      .select("id,sender_id,type,body,media_key,payload,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(300);
    if (error) throw new ApiError(403, "bukan participant percakapan ini");

    return ok({ items: data ?? [] });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/conversations/[id]/messages — kirim pesan text/image/location.
 * System & cod_action TIDAK bisa dikirim manual — dibuat sistem saat event COD
 * (PRD §25: quick actions memicu state machine, bukan sekadar pesan).
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    rateLimit(req, "msg-send", 30, 60 * 1000);
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const body = await parseBody(req, messageSendSchema);
    const db = userClient(req);

    const { data, error } = await db
      .from("messages")
      .insert({
        conversation_id: id,
        sender_id: user.id,
        type: body.type,
        body:
          body.type === "location" ? body.body || "Lokasi dikirim" : body.body,
        media_key: body.media_key ?? null,
      })
      .select("id,created_at")
      .single();
    if (error)
      throw new ApiError(
        403,
        "gagal kirim — bukan participant atau payload salah",
      );

    return ok(data, 201);
  } catch (e) {
    return handleError(e);
  }
}

void ApiError;
