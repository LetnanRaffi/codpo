"use client";

import {
  BadgeCheck,
  ChevronRight,
  Heart,
  LogOut,
  MessageSquare,
  Package,
  ReceiptText,
  Settings,
} from "lucide-react";
import Link from "next/link";

import { useMockAuth } from "@/components/providers/mock-auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MOCK_USER } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

const MENU = [
  { href: "/seller/dashboard", label: "Listing Saya", icon: Package },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/favorites", label: "Favorit", icon: Heart },
  { href: "/transactions", label: "Transaksi", icon: ReceiptText },
  { href: "#", label: "Pengaturan akun", icon: Settings },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { user, setMode, toggle } = useMockAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-sm py-16 text-center">
        <Avatar className="mx-auto size-20">
          <AvatarFallback className="bg-secondary text-xl font-bold">
            ?
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-wide uppercase">
          Kamu belum masuk
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Masuk buat lihat profil, favorit, dan transaksi COD kamu. Atau pakai
          toggle [DEV] di menu akun (ikon avatar di header).
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button className="rounded-full font-bold" asChild>
            <Link href="/login">Masuk</Link>
          </Button>
          <Button variant="outline" className="rounded-full font-bold" asChild>
            <Link href="/register">Daftar</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Rating", value: "4,9" },
    { label: "Transaksi selesai", value: "23" },
    { label: "Cancel rate", value: "2%" },
    { label: "No-show", value: "0×" },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Kartu profil */}
      <section className="flex items-center gap-4 rounded-xl border bg-card p-5">
        <Avatar className="size-16">
          <AvatarFallback className="bg-secondary text-xl font-bold">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1.5 truncate font-display text-2xl font-bold tracking-wide uppercase">
            {user.name}
            <BadgeCheck
              className="size-5 shrink-0 text-trust-green"
              aria-label="Terverifikasi"
            />
          </h1>
          <p className="text-sm text-muted-foreground">
            Member sejak Maret 2024 · Bekasi
          </p>
        </div>
      </section>

      {/* Mode switcher — PRD §6 */}
      <section className="space-y-3">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Mode aktif
        </p>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
          {(["buyer", "seller"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              aria-pressed={mode === user.mode}
              className={cn(
                "py-3 text-sm font-bold capitalize transition-colors",
                mode === user.mode
                  ? "bg-secondary"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {mode === "buyer" ? "🛍 Buyer" : "🏷 Seller"}
            </button>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Satu akun untuk dua mode. Ganti mode cuma ngubah tampilan &amp; menu —
          data tetap sama.
        </p>
      </section>

      {/* Stats PRD §37 */}
      <section className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border bg-card px-2 py-3 text-center"
          >
            <p className="font-display text-xl leading-none font-bold tabular-nums">
              {s.value}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* Menu */}
      <nav aria-label="Menu akun">
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {MENU.map(({ href, label, icon: Icon }) => (
            <li key={label}>
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent"
              >
                <Icon
                  className="size-4.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="flex-1 text-sm font-medium">{label}</span>
                <ChevronRight
                  className="size-4 text-muted-foreground/50"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Separator />

      {/* Info demo */}
      <div className="rounded-xl border border-dashed p-4 text-xs leading-relaxed text-muted-foreground">
        [DEV] Status login ini mock — toggle lewat menu akun di header. User
        demo: <span className="font-mono">{MOCK_USER.name}</span>. Auth beneran
        nyambung saat backend Supabase aktif.
      </div>

      <Button
        variant="outline"
        className="w-full rounded-full text-bu-red-deep hover:bg-bu-red/5 hover:text-bu-red"
        onClick={toggle}
      >
        <LogOut aria-hidden /> Keluar
      </Button>
    </div>
  );
}
