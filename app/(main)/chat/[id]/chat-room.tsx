"use client";

import {
  ArrowLeft,
  Flame,
  MapPin,
  Navigation,
  SendHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatIDR } from "@/lib/format";
import { MOCK_MESSAGES } from "@/lib/mock/chat";
import type { Conversation, Listing, Message } from "@/lib/types";

const QUICK_ACTIONS = [
  "Ajukan COD",
  "Kirim Lokasi",
  "Saya OTW",
  "Saya Sudah Sampai",
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Bubble({ message }: { message: Message }) {
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
    return (
      <div className="flex justify-start">
        <div className="w-56 overflow-hidden rounded-xl border">
          <div
            aria-hidden
            className="flex h-20 items-center justify-center bg-secondary"
          >
            <MapPin className="size-5 text-bu-red" />
          </div>
          <p className="px-3 py-2 text-xs">{message.body}</p>
        </div>
      </div>
    );
  }

  if (message.type === "image") {
    return (
      <div className="flex justify-start">
        <div className="w-44 overflow-hidden rounded-xl border">
          <div
            aria-hidden
            className="flex aspect-square items-center justify-center bg-paper-soft font-display text-4xl font-bold text-ink/10"
          >
            IMG
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
      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${message.sender_id === "usr-test" ? "ml-auto rounded-br-sm bg-bu-red text-white" : "mr-auto rounded-bl-sm bg-muted"}`}
    >
      {message.body}
      <span
        className={`mt-0.5 block font-mono text-[10px] ${message.sender_id === "usr-test" ? "text-white/70" : "text-muted-foreground"}`}
      >
        {time}
      </span>
    </p>
  );
}

export function ChatRoom({
  conversation,
  listing,
}: {
  conversation: Conversation;
  listing: Listing;
}) {
  const [messages, setMessages] = useState<Message[]>(
    MOCK_MESSAGES[conversation.id] ?? [],
  );
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function append(partial: Omit<Message, "id" | "created_at">) {
    setMessages((m) => [
      ...m,
      {
        ...partial,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  function handleQuickAction(action: (typeof QUICK_ACTIONS)[number]) {
    switch (action) {
      case "Ajukan COD":
        append({
          sender_id: "usr-test",
          type: "cod_action",
          body: "Menunggu usulan waktu & titik temu…",
          cod_status: "requested",
        });
        break;
      case "Kirim Lokasi":
        append({
          sender_id: "usr-test",
          type: "location",
          body: "Lokasiku sekarang — Titik temu disepakati dulu ya",
        });
        break;
      default:
        append({ sender_id: "usr-test", type: "system", body: action });
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    append({ sender_id: "usr-test", type: "text", body: text });
    setDraft("");
  }

  return (
    <div className="flex h-[calc(100dvh-9.75rem)] flex-col lg:h-full">
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
            {initials(listing.seller.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">
            {listing.seller.name}
          </p>
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
          <Bubble key={m.id} message={m} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto border-t px-4 pt-2 pb-1 [&::-webkit-scrollbar]:hidden">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => handleQuickAction(action)}
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

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3">
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
          disabled={!draft.trim()}
          aria-label="Kirim pesan"
        >
          <SendHorizontal className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
