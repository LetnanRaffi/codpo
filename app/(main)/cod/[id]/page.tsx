import { notFound, redirect } from "next/navigation";
import { LiveCodSession } from "@/components/cod/live-cod-session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function CodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/login?next=/cod/${id}`);
  const { data: session, error } = await db.from("cod_session_map").select("id,state,buyer_id,seller_id,meeting_point,meeting_lat,meeting_lng,scheduled_at").eq("id", id).maybeSingle();
  if (error || !session || ![session.buyer_id, session.seller_id].includes(user.id)) notFound();
  return <LiveCodSession sessionId={id} userId={user.id} initial={session} />;
}
