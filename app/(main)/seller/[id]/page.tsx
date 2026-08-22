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
import { MOCK_LISTINGS } from "@/lib/mock/data";

interface SellerPageProps {
  params: Promise<{ id: string }>;
}

function uniqueSellers() {
  const seen = new Set<string>();
  return MOCK_LISTINGS.filter((l) => {
    if (seen.has(l.seller.id)) return false;
    seen.add(l.seller.id);
    return true;
  }).map((l) => ({ id: l.seller.id }));
}

export function generateStaticParams() {
  return uniqueSellers();
}

export async function generateMetadata({
  params,
}: SellerPageProps): Promise<Metadata> {
  const { id } = await params;
  const seller = MOCK_LISTINGS.find((l) => l.seller.id === id)?.seller;
  if (!seller) notFound();
  return { title: seller.name };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function SellerProfilePage({ params }: SellerPageProps) {
  const { id } = await params;
  const listings = MOCK_LISTINGS.filter(
    (l) => l.seller.id === id && l.status === "active",
  );
  const seller = listings[0]?.seller;
  if (!seller) notFound();

  return (
    <div className="space-y-6">
      {/* Kartu profil publik — PRD §23 */}
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
        <Avatar className="size-20 shrink-0">
          <AvatarFallback className="bg-secondary text-2xl font-bold">
            {initials(seller.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="flex items-center gap-1.5 font-display text-2xl font-bold tracking-wide uppercase md:text-3xl">
            {seller.name}
            {seller.verified && (
              <BadgeCheck
                className="size-5 shrink-0 text-trust-green"
                aria-label="Seller terverifikasi"
              />
            )}
          </h1>
          <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden />
            {listings[0]?.area_label} · member sejak {seller.member_since}
          </p>
        </div>
        <Button variant="outline" className="rounded-full font-bold" asChild>
          <a href={`/chat?listing=${listings[0]?.id ?? ""}`}>Chat Seller</a>
        </Button>
      </section>

      {/* Reputasi PRD §37 */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          {
            icon: Star,
            label: "Rating",
            value: seller.rating.toLocaleString("id-ID"),
          },
          {
            icon: Package,
            label: "Transaksi selesai",
            value: seller.completed_transactions.toLocaleString("id-ID"),
          },
          { icon: Clock3, label: "Respon chat", value: "~15 mnt" },
          { icon: ShieldCheck, label: "Cancel rate", value: "3%" },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border bg-card px-3 py-3.5 text-center"
          >
            <Icon
              className="mx-auto size-4 text-muted-foreground"
              aria-hidden
            />
            <p className="mt-1.5 font-display text-xl leading-none font-bold tabular-nums">
              {value}
            </p>
            <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </section>

      {/* Listing aktif */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold tracking-wide uppercase">
          Barang Dijual{" "}
          <span className="font-mono text-sm font-normal text-muted-foreground normal-case">
            ({listings.length})
          </span>
        </h2>
        {listings.length > 0 ? (
          <ListingGrid listings={listings} />
        ) : (
          <EmptyState
            title="Belum ada barang aktif"
            description="Cek lagi nanti, atau lihat barang BU lain di sekitarmu."
            actionLabel="Lihat BU Terdekat"
            actionHref="/search?bu=1"
          />
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Alamat lengkap &amp; lokasi presisi gak ditampilkan — titik COD cuma
        dibagi setelah deal.
      </p>
    </div>
  );
}
