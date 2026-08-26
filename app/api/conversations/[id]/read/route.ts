import { ApiError, handleError, ok } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { userClient } from "@/lib/server/user-client";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const db = userClient(req);
    const { data: participant, error: participantError } = await db
      .from("conversation_participants")
      .select("conversation_id")
      .eq("conversation_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (participantError) throw participantError;
    if (!participant) throw new ApiError(404, "percakapan tidak ditemukan");

    const { error } = await db.from("conversation_reads").upsert(
      {
        conversation_id: id,
        user_id: user.id,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id,user_id" },
    );
    if (error) throw error;
    return ok({ read: true });
  } catch (error) {
    return handleError(error);
  }
}
