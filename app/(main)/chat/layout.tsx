"use client";

import { usePathname } from "next/navigation";

import { ConversationList } from "@/app/(main)/chat/conversation-list";
import { cn } from "@/lib/utils";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const inRoom = /^\/chat\/.+/.test(pathname);

  return (
    <div className="lg:flex lg:h-[calc(100dvh-9.5rem)] lg:overflow-hidden lg:rounded-xl lg:border">
      {/* mobile: list tampil hanya di /chat — desktop: sidebar kiri permanen */}
      <ConversationList
        className={cn(
          "w-full flex-col border-b lg:flex lg:w-80 lg:shrink-0 lg:border-b-0",
          inRoom ? "hidden" : "flex",
        )}
      />
      <div className="min-w-0 flex-1 lg:border-l">{children}</div>
    </div>
  );
}
