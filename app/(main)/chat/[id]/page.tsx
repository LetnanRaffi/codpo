import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ChatRoom } from "@/app/(main)/chat/[id]/chat-room";
import { getListing, publicObjectUrl } from "@/lib/server/marketplace";
import { createClient } from "@/lib/supabase/server";

interface ChatRoomPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Percakapan" };
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { id } = await params;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect(`/login?next=/chat/${id}`);
  const { data: conversation, error: conversationError } = await db
    .from("conversations")
    .select("id,listing_id,buyer_id,seller_id,created_at,last_message_at")
    .eq("id", id)
    .maybeSingle();
  if (conversationError) throw conversationError;
  if (!conversation) notFound();
  const otherId =
    conversation.buyer_id === user.id
      ? conversation.seller_id
      : conversation.buyer_id;
  const [listing, profileResult, messagesResult] = await Promise.all([
    getListing(conversation.listing_id),
    db.from("profiles").select("name").eq("id", otherId).maybeSingle(),
    db
      .from("messages")
      .select("id,sender_id,type,body,media_key,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(300),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (messagesResult.error) throw messagesResult.error;
  if (!listing) notFound();

  return (
    <ChatRoom
      conversation={{
        id,
        listing_id: conversation.listing_id,
        participant_id: otherId,
        last_message: "",
        unread_count: 0,
        updated_at: conversation.last_message_at ?? conversation.created_at,
      }}
      listing={listing}
      currentUserId={user.id}
      otherName={profileResult.data?.name ?? "Pengguna"}
      mediaUrlPrefix={
        process.env.R2_PUBLIC_BASE_URL
          ? `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/`
          : "/api/media?key="
      }
      initialMessages={(messagesResult.data ?? []).map((message) => ({
        ...message,
        image_url: message.media_key
          ? publicObjectUrl(message.media_key)
          : null,
      }))}
    />
  );
}
