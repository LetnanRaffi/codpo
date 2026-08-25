import {
  BadgeCheck,
  Clock3,
  MapPin,
  Package,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ListingGrid } from "@/components/listing/listing-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { listingFromRow } from "@/lib/server/marketplace";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const db = await createClient();
  const { data } = await db
    .from("profiles")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.name ?? "Seller" };
}
export default async function SellerPage({ params }: Props) {
  const { id } = await params;
  const db = await createClient();
  const [{ data: profile }, { data: reputation }, { data: rows }] =
    await Promise.all([
      db
        .from("profiles")
        .select("id,name,verified,created_at")
        .eq("id", id)
        .maybeSingle(),
      db
        .from("user_reputation")
        .select(
          "avg_rating,completed_transactions,noshow_count,cancellation_rate_pct",
        )
        .eq("user_id", id)
        .maybeSingle(),
      db
        .from("listing_public")
        .select("*")
        .eq("seller_id", id)
        .order("created_at", { ascending: false }),
    ]);
  if (!profile) notFound();
  const rating = Number(reputation?.avg_rating ?? 0);
  const seller = {
    id,
    name: profile.name,
    avatar_url: null,
    rating,
    completed_transactions: Number(reputation?.completed_transactions ?? 0),
    verified: profile.verified,
    member_since: profile.created_at.slice(0, 7),
  };
  const listings = (rows ?? []).map((row) => listingFromRow(row, { seller }));
  const initials = profile.name
    .split(" ")
    .map((part: string) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
        <Avatar className="size-20">
          <AvatarFallback className="bg-secondary text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1.5 font-display text-3xl font-bold uppercase">
            {profile.name}
            {profile.verified && (
              <BadgeCheck className="size-5 text-trust-green" />
            )}
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {listings[0]?.area_label ?? "Indonesia"} · member sejak{" "}
            {seller.member_since}
          </p>
        </div>
        {listings[0] && (
          <Button variant="outline" className="rounded-full" asChild>
            <a href={`/chat?listing=${listings[0].id}`}>Chat Seller</a>
          </Button>
        )}
      </section>
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          {
            icon: Star,
            label: "Rating",
            value: rating.toLocaleString("id-ID"),
          },
          {
            icon: Package,
            label: "Transaksi selesai",
            value: seller.completed_transactions,
          },
          { icon: Clock3, label: "Listing aktif", value: listings.length },
          {
            icon: ShieldCheck,
            label: "No-show",
            value: Number(reputation?.noshow_count ?? 0),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border p-3 text-center">
            <Icon className="mx-auto size-4 text-muted-foreground" />
            <p className="mt-1 font-display text-xl font-bold">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold uppercase">
          Barang Dijual ({listings.length})
        </h2>
        {listings.length ? (
          <ListingGrid listings={listings} />
        ) : (
          <EmptyState
            title="Belum ada barang aktif"
            description="Cek lagi nanti."
            actionLabel="Lihat BU Terdekat"
            actionHref="/search?bu=1"
          />
        )}
      </section>
    </div>
  );
}
