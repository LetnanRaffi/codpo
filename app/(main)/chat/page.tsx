import type { Metadata } from "next";
import { ChatIndexClient } from "@/app/(main)/chat/chat-index-client";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>;
}) {
  const { listing } = await searchParams;
  return <ChatIndexClient listingId={listing} />;
}
