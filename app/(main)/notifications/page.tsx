"use client";

import { Bell, Check } from "lucide-react";
import { useRouter } from "next/navigation";
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

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const load = useCallback(
    () =>
      apiFetch<{ items: Notification[] }>("/api/notifications")
        .then((data) => setItems(data.items))
        .catch(() => setItems([])),
    [],
  );
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/notifications");
      return;
    }
    void load();
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
      {items.length ? (
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
                    }).then(load)
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
