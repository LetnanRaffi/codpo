import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatRoom } from "@/app/(main)/chat/[id]/chat-room";
import { MOCK_CONVERSATIONS } from "@/lib/mock/chat";
import { MOCK_LISTINGS } from "@/lib/mock/data";

interface ChatRoomPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ChatRoomPageProps): Promise<Metadata> {
  const { id } = await params;
  const conversation = MOCK_CONVERSATIONS.find((c) => c.id === id);
  if (!conversation) notFound();
  const listing = MOCK_LISTINGS.find((l) => l.id === conversation.listing_id);
  if (!listing) notFound();
  return { title: listing.seller.name };
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { id } = await params;
  const conversation = MOCK_CONVERSATIONS.find((c) => c.id === id);
  if (!conversation) notFound();

  const listing = MOCK_LISTINGS.find((l) => l.id === conversation.listing_id);
  if (!listing) notFound();

  return <ChatRoom conversation={conversation} listing={listing} />;
}
