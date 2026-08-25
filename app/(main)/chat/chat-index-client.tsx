"use client";

import { LoaderCircle, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiFetch } from "@/lib/client/api";

export function ChatIndexClient({ listingId }: { listingId?: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!listingId || loading) return;
    if (!user) {
      router.replace(`/login?next=/chat?listing=${listingId}`);
      return;
    }
    apiFetch<{ conversation_id: string }>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ listing_id: listingId }),
    })
      .then(({ conversation_id }) => router.replace(`/chat/${conversation_id}`))
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Gagal membuka chat"),
      );
  }, [listingId, loading, router, user]);

  if (listingId)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <LoaderCircle className="size-7 animate-spin text-muted-foreground" />
        <p className="font-semibold">Membuka percakapan…</p>
        {error && <p className="text-sm text-bu-red-deep">{error}</p>}
      </div>
    );

  return (
    <div className="hidden h-full flex-col items-center justify-center gap-2 p-8 text-center lg:flex">
      <MessageSquare className="size-8 text-muted-foreground/50" aria-hidden />
      <p className="font-semibold">Pilih percakapan</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Semua chat soal barang &amp; COD kamu tampil di sini.
      </p>
    </div>
  );
}
