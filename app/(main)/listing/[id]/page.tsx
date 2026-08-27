import {
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  Flame,
  MapPin,
  MessageSquare,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CodRequestDialog } from "@/components/listing/cod-request-dialog";
import { FavoriteButton } from "@/components/listing/favorite-button";
import { ReportDialog } from "@/components/listing/report-dialog";
import { Gallery } from "@/components/listing/gallery";
import { PriceStrike } from "@/components/price-strike";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistance, formatIDR, timeAgo } from "@/lib/format";
import { CONDITION_LABELS, effectivePrice } from "@/lib/listing";
import {
  getCategories,
  getListing,
  recordListingView,
} from "@/lib/server/marketplace";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();
  return { title: listing.title };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const [listing, categories] = await Promise.all([
    getListing(id),
    getCategories(),
  ]);
  if (!listing) notFound();
  await recordListingView(id);

  const category = categories.find((c) => c.slug === listing.category_slug);
  const isBU = listing.sale_type === "BU";

  const infoBlock = (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {isBU && (
            <Badge className="gap-1 rounded-full bg-bu-red font-bold text-white hover:bg-bu-red">
              <Flame className="size-3" aria-hidden /> BU — BUTUH UANG
            </Badge>
          )}
          {isBU && listing.bu_expires_at && (
            <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" aria-hidden />
              s/d{" "}
              {new Date(listing.bu_expires_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>

        <h1 className="text-xl leading-snug font-semibold md:text-2xl">
          {listing.title}
        </h1>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {isBU && (
            <PriceStrike className="text-base text-muted-foreground">
              {formatIDR(listing.price)}
            </PriceStrike>
          )}
          <p className="font-display text-4xl leading-none font-bold tracking-wide">
            {formatIDR(effectivePrice(listing))}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {listing.area_label} · {formatDistance(listing.distance_km)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-gold text-gold" aria-hidden />
            {listing.seller_rating.toLocaleString("id-ID")} rating seller
          </span>
          <span>Dilihat {listing.views}×</span>
        </div>
      </div>

      <Separator />

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Kondisi</dt>
        <dd className="font-medium">{CONDITION_LABELS[listing.condition]}</dd>
        <dt className="text-muted-foreground">Kategori</dt>
        <dd className="font-medium">{category?.name ?? "-"}</dd>
        <dt className="text-muted-foreground">COD</dt>
        <dd>
          {listing.cod_available ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-trust-green">
              <span
                className="size-1.5 rounded-full bg-trust-green"
                aria-hidden
              />
              Bisa COD sekarang
            </span>
          ) : (
            <span className="text-muted-foreground">COD by request</span>
          )}
        </dd>
        <dt className="text-muted-foreground">Dipasang</dt>
        <dd className="font-mono text-xs">{timeAgo(listing.created_at)}</dd>
      </dl>

      <Separator />

      <div className="space-y-2">
        <h2 className="font-semibold">Deskripsi</h2>
        <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
          {listing.description}
        </p>
      </div>

      <Separator />

      {/* Seller */}
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <Avatar className="size-11">
          <AvatarFallback className="bg-secondary font-bold">
            {initials(listing.seller.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate font-semibold">
            {listing.seller.name}
            {listing.seller.verified && (
              <BadgeCheck
                className="size-4 shrink-0 text-trust-green"
                aria-label="Seller terverifikasi"
              />
            )}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            ⭐ {listing.seller.rating.toLocaleString("id-ID")} ·{" "}
            {listing.seller.completed_transactions} transaksi selesai · sejak{" "}
            {listing.seller.member_since}
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" asChild>
          <Link href={`/seller/${listing.seller.id}`}>Lihat profil</Link>
        </Button>
      </div>

      {/* CTA desktop */}
      <div className="hidden gap-2 md:flex">
        <CodRequestDialog
          listingId={listing.id}
          listingTitle={listing.title}
          meetingFallback={
            listing.approx_lat != null && listing.approx_lng != null
              ? { lat: listing.approx_lat, lng: listing.approx_lng }
              : null
          }
          trigger={
            <Button size="lg" className="flex-1 rounded-full font-bold">
              Ajukan COD
            </Button>
          }
        />
        <Button
          size="lg"
          variant="outline"
          className="flex-1 rounded-full font-bold"
          asChild
        >
          <Link href={`/chat?listing=${listing.id}`}>
            <MessageSquare aria-hidden /> Chat Seller
          </Link>
        </Button>
        <FavoriteButton listingId={listing.id} />
      </div>

      <p className="hidden text-center text-xs text-muted-foreground md:block">
        Bayar langsung saat ketemu (cash/transfer/e-wallet). CODPO gak pegang
        uang transaksi.
      </p>
      <div className="flex justify-center">
        <ReportDialog listingId={listing.id} />
      </div>
    </div>
  );

  return (
    <div className="pb-20 md:pb-0">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-1 truncate text-sm text-muted-foreground">
          <li>
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <Link
              href={`/category/${listing.category_slug}`}
              className="transition-colors hover:text-foreground"
            >
              {category?.name}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li
            aria-current="page"
            className="truncate font-medium text-foreground"
          >
            {listing.title}
          </li>
        </ol>
      </nav>

      <div className="lg:flex lg:items-start lg:gap-10">
        <div className="min-w-0 lg:sticky lg:top-24 lg:w-1/2">
          <Gallery images={listing.images} title={listing.title} />
        </div>
        <div className="mt-6 min-w-0 lg:mt-0 lg:w-1/2">{infoBlock}</div>
      </div>

      {/* CTA mobile — nempel di atas bottom nav */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t bg-background/95 px-4 py-2.5 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl gap-2">
          <CodRequestDialog
            listingId={listing.id}
            listingTitle={listing.title}
            meetingFallback={
              listing.approx_lat != null && listing.approx_lng != null
                ? { lat: listing.approx_lat, lng: listing.approx_lng }
                : null
            }
            trigger={
              <Button className="flex-1 rounded-full font-bold">
                Ajukan COD
              </Button>
            }
          />
          <Button variant="outline" className="rounded-full font-bold" asChild>
            <Link href={`/chat?listing=${listing.id}`} aria-label="Chat seller">
              <MessageSquare aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
