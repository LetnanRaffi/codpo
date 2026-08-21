"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MOCK_CONVERSATIONS } from "@/lib/mock/chat";
import { timeAgo } from "@/lib/format";
import { MOCK_LISTINGS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

function participantName(participantId: string) {
  return (
    MOCK_LISTINGS.find((l) => l.seller.id === participantId)?.seller.name ??
    "Seller"
  );
}

export function ConversationList({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex min-h-0 flex-col", className)}>
      <div className="hidden border-b px-4 py-3 lg:block">
        <h1 className="font-display text-xl font-bold tracking-wide uppercase">
          Chat
        </h1>
      </div>
      <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
        {MOCK_CONVERSATIONS.map((cnv) => {
          const listing = MOCK_LISTINGS.find((l) => l.id === cnv.listing_id);
          const active = pathname === `/chat/${cnv.id}`;
          return (
            <li key={cnv.id}>
              <Link
                href={`/chat/${cnv.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors",
                  active ? "bg-secondary" : "hover:bg-accent",
                )}
              >
                <div
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-paper-soft font-display text-xl font-bold text-ink/30"
                >
                  {(listing?.title ?? "?").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        cnv.unread_count > 0 ? "font-bold" : "font-semibold",
                      )}
                    >
                      {participantName(cnv.participant_id)}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {timeAgo(cnv.updated_at)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {listing?.title}
                  </p>
                  <p
                    className={cn(
                      "truncate text-sm",
                      cnv.unread_count > 0
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {cnv.last_message}
                  </p>
                </div>
                {cnv.unread_count > 0 && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-bu-red font-mono text-[10px] font-bold text-white">
                    {cnv.unread_count}
                  </span>
                )}
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground lg:hidden"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
