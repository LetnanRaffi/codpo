"use client";

import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Heart,
  LogOut,
  MessageSquare,
  Package,
  ReceiptText,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MENU = [
  { href: "/seller/dashboard", label: "Listing Saya", icon: Package },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/favorites", label: "Favorit", icon: Heart },
  { href: "/transactions", label: "Transaksi", icon: ReceiptText },
  { href: "/notifications", label: "Notifikasi", icon: Bell },
] as const;

export function ProfileClient() {
  const {
    user,
    profile,
    loading,
    error: authError,
    setMode,
    signOut,
  } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [stats, setStats] = useState({ rating: 0, completed: 0, noShow: 0 });
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/profile");
    if (!user) return;
    const db = createClient();
    Promise.all([
      db.from("profiles").select("name").eq("id", user.id).single(),
      db
        .from("user_contacts")
        .select("phone")
        .eq("user_id", user.id)
        .maybeSingle(),
      db
        .from("user_reputation")
        .select("avg_rating,completed_transactions,noshow_count")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([p, c, r]) => {
      const loadError = p.error ?? c.error ?? r.error;
      if (loadError) {
        setMessage(loadError.message);
        return;
      }
      setName(p.data?.name ?? "");
      setPhone(c.data?.phone ?? "");
      setStats({
        rating: Number(r.data?.avg_rating ?? 0),
        completed: Number(r.data?.completed_transactions ?? 0),
        noShow: Number(r.data?.noshow_count ?? 0),
      });
    });
  }, [loading, router, user]);
  if (user && authError)
    return (
      <div className="rounded-xl border border-bu-red/30 bg-bu-red/5 p-5 text-sm text-bu-red-deep">
        Profil gagal dimuat: {authError}
      </div>
    );
  if (!user || !profile)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Memuat profil…
      </p>
    );
  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  async function save() {
    if (!user) return;
    setMessage("");
    if (name.trim().length < 3) {
      setMessage("Nama minimal 3 karakter");
      return;
    }
    if (phone && !/^08\d{8,11}$/.test(phone)) {
      setMessage("Nomor WhatsApp harus format 08xxx, 10–13 digit");
      return;
    }
    setPending(true);
    const db = createClient();
    const [{ error: pError }, { error: cError }] = await Promise.all([
      db.from("profiles").update({ name: name.trim() }).eq("id", user.id),
      db
        .from("user_contacts")
        .upsert({ user_id: user.id, phone: phone.trim() || null }),
    ]);
    setMessage(pError?.message ?? cError?.message ?? "Profil tersimpan");
    setPending(false);
    if (!pError && !cError) router.refresh();
  }
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section className="flex items-center gap-4 rounded-xl border bg-card p-5">
        <Avatar className="size-16">
          <AvatarFallback className="bg-secondary text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="flex items-center gap-1.5 font-display text-2xl font-bold uppercase">
            {profile.name}
            {profile.verified && (
              <BadgeCheck className="size-5 text-trust-green" />
            )}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </section>
      <section className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          Mode aktif
        </p>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border">
          {(["buyer", "seller"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() =>
                void setMode(mode).catch((cause) =>
                  setMessage(
                    cause instanceof Error
                      ? cause.message
                      : "Gagal mengubah mode",
                  ),
                )
              }
              disabled={pending}
              className={cn(
                "py-3 text-sm font-bold",
                mode === profile.mode
                  ? "bg-secondary"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {mode === "buyer" ? "🛍 Buyer" : "🏷 Seller"}
            </button>
          ))}
        </div>
      </section>
      <section className="grid grid-cols-3 gap-2">
        {[
          { label: "Rating", value: stats.rating.toLocaleString("id-ID") },
          { label: "Transaksi", value: stats.completed },
          { label: "No-show", value: stats.noShow },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border p-3 text-center">
            <p className="font-display text-xl font-bold">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>
      <section className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Data akun</h2>
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Nama</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-phone">Nomor WhatsApp</Label>
          <Input
            id="profile-phone"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value.replace(/\D/g, ""))
            }
            placeholder="08xxxxxxxxxx"
          />
        </div>
        <Button
          className="w-full rounded-full"
          onClick={() => void save()}
          disabled={pending}
        >
          <Save /> {pending ? "Menyimpan…" : "Simpan profil"}
        </Button>
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </section>
      <nav>
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {MENU.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent"
              >
                <Icon className="size-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{label}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Button
        variant="outline"
        className="w-full rounded-full text-bu-red-deep"
        onClick={() =>
          void signOut()
            .then(() => router.replace("/"))
            .catch((cause) =>
              setMessage(
                cause instanceof Error ? cause.message : "Gagal keluar",
              ),
            )
        }
      >
        <LogOut /> Keluar
      </Button>
    </div>
  );
}
