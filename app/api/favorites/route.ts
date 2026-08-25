import { handleError, ok } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { userClient } from "@/lib/server/user-client";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const { data, error } = await userClient(req)
      .from("favorites")
      .select("listing_id,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok({ items: data ?? [] });
  } catch (error) {
    return handleError(error);
  }
}
