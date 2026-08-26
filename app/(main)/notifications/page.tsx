"use client";

import { Bell, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client/api";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

function notificationHref(item: Notification) {
  const conversationId = item.data.conversation_id;
  const listingId = item.data.listing_id;
  if (typeof conversationId === "string") return `/chat/${conversationId}`;
  if (typeof listingId === "string") return `/listing/${listingId}`;
  if (typeof item.data.transaction_id === "string") return "/transactions";
  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setDataLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ items: Notification[] }>(
        "/api/notifications",
      );
      setItems(data.items);
    } catch (cause) {
      setItems([]);
      setError(
        cause instanceof Error ? cause.message : "Gagal memuat notifikasi",
      );
    } finally {
      setDataLoading(false);
    }
  }, []);
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/notifications");
      return;
    }
    queueMicrotask(() => void load());
  }, [load, loading, router, user]);
  if (loading || !user)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Memuat notifikasi…
      </p>
    );
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase">
          Notifikasi
        </h1>
        <p className="text-xs text-muted-foreground">
          Update chat, COD, transaksi, dan moderasi
        </p>
      </div>
      {dataLoading ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Memuat notifikasi…
        </p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-bu-red/30 bg-bu-red/5 p-5 text-sm text-bu-red-deep"
        >
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-full"
            onClick={() => void load()}
          >
            Coba lagi
          </Button>
        </div>
      ) : items.length ? (
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          {items.map((item) => (
            <article
              key={item.id}
              className={`flex gap-3 p-4 ${item.read_at ? "opacity-65" : ""}`}
            >
              <Bell className="mt-0.5 size-4 shrink-0 text-bu-red" />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {new Date(item.created_at).toLocaleString("id-ID")}
                </p>
                {notificationHref(item) && (
                  <Link
                    href={notificationHref(item)!}
                    className="mt-1 inline-block text-xs font-semibold text-bu-red hover:underline"
                  >
                    Buka detail
                  </Link>
                )}
              </div>
              {!item.read_at && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Tandai dibaca"
                  onClick={() =>
                    void apiFetch(`/api/notifications/${item.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ read: true }),
                    })
                      .then(load)
                      .catch((cause) =>
                        setError(
                          cause instanceof Error
                            ? cause.message
                            : "Gagal menandai notifikasi",
                        ),
                      )
                  }
                >
                  <Check />
                </Button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="size-8" />}
          title="Belum ada notifikasi"
          description="Update penting akunmu akan tampil di sini."
        />
      )}
    </div>
  );
}
