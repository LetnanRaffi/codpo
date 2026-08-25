"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch } from "@/lib/client/api";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface InboxItem {
  id: string;
  listing_id: string;
  last_message_at: string | null;
  last_message: string;
  created_at: string;
  other_user_name: string;
  unread_count: number;
  listings: { title?: string } | null;
}

export function ConversationList({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${pathname}`);
      return;
    }
    apiFetch<{ items: InboxItem[] }>("/api/conversations")
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }, [loading, pathname, router, user]);

  return (
    <aside className={cn("flex min-h-0 flex-col", className)}>
      <div className="hidden border-b px-4 py-3 lg:block">
        <h1 className="font-display text-xl font-bold tracking-wide uppercase">
          Chat
        </h1>
      </div>
      <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
        {items.map((cnv) => {
          const title = cnv.listings?.title ?? "Listing";
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
                  {title.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        cnv.unread_count > 0 ? "font-bold" : "font-semibold",
                      )}
                    >
                      {cnv.other_user_name}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {timeAgo(cnv.last_message_at ?? cnv.created_at)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {title}
                  </p>
                  <p
                    className={cn(
                      "truncate text-sm",
                      cnv.unread_count > 0
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {cnv.last_message || "Mulai percakapan"}
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
