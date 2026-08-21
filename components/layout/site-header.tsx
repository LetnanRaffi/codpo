"use client";

import { Heart, MessageCircle, ReceiptText, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AccountMenu } from "@/components/layout/account-menu";
import { LocationPicker } from "@/components/layout/location-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HEADER_ACTIONS = [
  { href: "/chat", label: "Chat", icon: MessageCircle, badge: 2 },
  { href: "/favorites", label: "Favorit", icon: Heart, badge: 5 },
  { href: "/transactions", label: "Transaksi", icon: ReceiptText, badge: 1 },
];

function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      className="min-w-0 flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari barang murah sekitar…"
          aria-label="Cari barang"
          className="rounded-full border-transparent bg-secondary pl-10 text-sm focus-visible:bg-background md:h-10"
        />
      </div>
    </form>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 md:h-16 md:gap-4">
        <Link
          href="/"
          aria-label="CODPO — ke beranda"
          className="flex shrink-0 items-center gap-2"
        >
          <Image
            src="/logo-codpo.png"
            alt=""
            width={36}
            height={36}
            priority
            className="size-8 md:size-9"
          />
          <span className="hidden font-display text-[1.65rem] leading-none font-bold tracking-wide uppercase min-[420px]:inline">
            CODPO
          </span>
        </Link>

        <SearchBar />

        <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-1.5">
          <LocationPicker />
          <nav
            aria-label="Pesan, favorit, transaksi"
            className="hidden items-center md:flex"
          >
            {HEADER_ACTIONS.map(({ href, label, icon: Icon, badge }) => (
              <Button
                key={href}
                variant="ghost"
                size="icon"
                className="relative"
                asChild
              >
                <Link
                  href={href}
                  aria-label={`${label}${badge > 0 ? `, ${badge} baru` : ""}`}
                >
                  <Icon className="size-5" />
                  {badge > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 size-4 min-w-4 justify-center rounded-full p-0 text-[10px] tabular-nums">
                      {badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            ))}
          </nav>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
