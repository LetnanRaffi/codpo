"use client";

import {
  ArrowLeft,
  Flame,
  ImagePlus,
  MapPin,
  Navigation,
  SendHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CodRequestDialog } from "@/components/listing/cod-request-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/format";
import { apiFetch } from "@/lib/client/api";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Listing, Message } from "@/lib/types";

const QUICK_ACTIONS = ["Kirim Lokasi"] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function mediaUrl(prefix: string, key: string) {
  return prefix.endsWith("key=")
    ? `${prefix}${encodeURIComponent(key)}`
    : `${prefix}${key}`;
}

function Bubble({
  message,
  currentUserId,
}: {
  message: Message;
  currentUserId: string;
}) {
  const time = new Date(message.created_at).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.type === "cod_action") {
    return (
      <div className="flex justify-center py-1">
        <div className="max-w-xs rounded-xl border border-bu-red/30 bg-bu-red/5 px-3 py-2 text-center">
          <p className="flex items-center justify-center gap-1 text-xs font-bold text-bu-red-deep">
            <Flame className="size-3" aria-hidden /> AJUKAN COD
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {message.body}
          </p>
        </div>
      </div>
    );
  }

  if (message.type === "location") {
    const mapUrl = message.body.match(
      /https:\/\/maps\.google\.com\/\?q=[^\s]+/,
    )?.[0];
    return (
      <div
        className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
      >
        <div className="w-56 overflow-hidden rounded-xl border">
          <div
            aria-hidden
            className="flex h-20 items-center justify-center bg-secondary"
          >
            <MapPin className="size-5 text-bu-red" />
          </div>
          <div className="px-3 py-2 text-xs">
            <p>
              {message.body.replace(mapUrl ?? "", "").trim() || "Lokasi saya"}
            </p>
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-bu-red hover:underline"
              >
                Buka di Google Maps
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "image") {
    return (
      <div
        className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
      >
        <div className="w-44 overflow-hidden rounded-xl border">
          <div className="relative aspect-square bg-paper-soft">
            {message.image_url ? (
              /* Endpoint chat diminta langsung oleh browser agar cookie
                 participant ikut terkirim. */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={message.image_url}
                alt={message.body || "Gambar chat"}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center font-display text-4xl font-bold text-ink/10">
                IMG
              </div>
            )}
          </div>
          <p className="truncate px-3 py-2 font-mono text-[11px] text-muted-foreground">
            {message.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <p
      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${message.sender_id === currentUserId ? "ml-auto rounded-br-sm bg-bu-red text-white" : "mr-auto rounded-bl-sm bg-muted"}`}
    >
      {message.body}
      <span
        className={`mt-0.5 block font-mono text-[10px] ${message.sender_id === currentUserId ? "text-white/70" : "text-muted-foreground"}`}
      >
        {time}
      </span>
    </p>
  );
}

export function ChatRoom({
  conversation,
  listing,
  currentUserId,
  otherName,
  mediaUrlPrefix,
  initialMessages,
}: {
  conversation: Conversation;
  listing: Listing;
  currentUserId: string;
  otherName: string;
  mediaUrlPrefix: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const message = payload.new as Message;
          if (message.media_key) {
            message.image_url = mediaUrl(mediaUrlPrefix, message.media_key);
          }
          setMessages((current) =>
            current.some((item) => item.id === message.id)
              ? current
              : [...current, message],
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversation.id, mediaUrlPrefix]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const latest = messages.at(-1);
    if (!latest || document.hidden) return;
    void apiFetch(`/api/conversations/${conversation.id}/read`, {
      method: "PATCH",
    }).catch((cause) => console.error("[chat.read]", cause));
  }, [conversation.id, currentUserId, messages]);

  async function handleQuickAction() {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung lokasi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await apiFetch(`/api/conversations/${conversation.id}/messages`, {
            method: "POST",
            body: JSON.stringify({
              type: "location",
              body: `Lokasi saya: https://maps.google.com/?q=${coords.latitude},${coords.longitude}`,
            }),
          });
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : "Gagal mengirim lokasi",
          );
        }
      },
      () => setError("Izin lokasi ditolak."),
    );
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setError("");
    try {
      const sent = await apiFetch<{ id: string; created_at: string }>(
        `/api/conversations/${conversation.id}/messages`,
        { method: "POST", body: JSON.stringify({ type: "text", body: text }) },
      );
      setMessages((current) =>
        current.some((item) => item.id === sent.id)
          ? current
          : [
              ...current,
              { ...sent, sender_id: currentUserId, type: "text", body: text },
            ],
      );
      setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Gunakan JPG, PNG, atau WebP maksimal 5 MB.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const signed = await apiFetch<{
        key: string;
        upload_url: string;
        headers: Record<string, string>;
      }>("/api/upload/presign", {
        method: "POST",
        body: JSON.stringify({
          kind: "chat",
          mime: file.type,
          size: file.size,
        }),
      });
      const upload = await fetch(signed.upload_url, {
        method: "PUT",
        headers: signed.headers,
        body: file,
      });
      if (!upload.ok) throw new Error("Upload gambar gagal");
      const sent = await apiFetch<{ id: string; created_at: string }>(
        `/api/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            type: "image",
            body: file.name,
            media_key: signed.key,
          }),
        },
      );
      setMessages((current) =>
        current.some((item) => item.id === sent.id)
          ? current
          : [
              ...current,
              {
                ...sent,
                sender_id: currentUserId,
                type: "image",
                body: file.name,
                media_key: signed.key,
                image_url: mediaUrl(mediaUrlPrefix, signed.key),
              },
            ],
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal mengirim gambar",
      );
    } finally {
      setSending(false);
      if (imageRef.current) imageRef.current.value = "";
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col lg:h-full">
      {/* Header room */}
      <header className="flex items-center gap-3 border-b px-4 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 size-8 shrink-0 lg:hidden"
          asChild
        >
          <Link href="/chat" aria-label="Kembali ke daftar chat">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="bg-secondary text-xs font-bold">
            {initials(otherName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{otherName}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            ⭐ {listing.seller.rating.toLocaleString("id-ID")} · biasanya balas
            cepat
          </p>
        </div>
      </header>

      {/* Konteks listing */}
      <Link
        href={`/listing/${listing.id}`}
        className="flex items-center gap-3 border-b bg-paper-soft/60 px-4 py-2 transition-colors hover:bg-accent"
      >
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-background font-display text-lg font-bold text-ink/30"
        >
          {listing.title.charAt(0)}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-xs font-medium">{listing.title}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {formatIDR(
              listing.sale_type === "BU" && listing.bu_price !== null
                ? listing.bu_price
                : listing.price,
            )}
          </p>
        </div>
        {listing.sale_type === "BU" && (
          <Badge className="gap-0.5 rounded-full bg-bu-red px-1.5 text-[10px] font-bold hover:bg-bu-red">
            <Flame className="size-2.5" aria-hidden /> BU
          </Badge>
        )}
      </Link>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4"
      >
        {messages.map((m) => (
          <Bubble key={m.id} message={m} currentUserId={currentUserId} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto border-t px-4 pt-2 pb-1 [&::-webkit-scrollbar]:hidden">
        <CodRequestDialog
          listingId={listing.id}
          listingTitle={listing.title}
          conversationId={conversation.id}
          trigger={
            <button
              type="button"
              className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs font-medium"
            >
              Ajukan COD
            </button>
          }
        />
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => handleQuickAction()}
            className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors hover:bg-accent"
          >
            {action === "Kirim Lokasi" && (
              <Navigation
                className="mr-1 inline size-3 text-bu-red"
                aria-hidden
              />
            )}
            {action}
          </button>
        ))}
      </div>
      {error && (
        <p className="px-4 text-xs font-medium text-bu-red-deep">{error}</p>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3">
        <input
          ref={imageRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => void handleImage(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          disabled={sending}
          onClick={() => imageRef.current?.click()}
          aria-label="Kirim gambar"
        >
          <ImagePlus className="size-4" aria-hidden />
        </Button>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tulis pesan…"
          aria-label="Tulis pesan"
          className="rounded-full"
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0 rounded-full"
          disabled={!draft.trim() || sending}
          aria-label="Kirim pesan"
        >
          <SendHorizontal className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
