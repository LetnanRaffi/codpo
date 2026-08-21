import { Flame, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { PriceStrike } from "@/components/price-strike";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatIDR } from "@/lib/format";
import { effectivePrice } from "@/lib/listing";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ListingCard({
  listing,
  className,
}: {
  listing: Listing;
  className?: string;
}) {
  const isBU = listing.sale_type === "BU";

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={cn(
        "group block overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-paper-soft">
        {listing.images[0] ? (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center"
          >
            <span className="font-display text-6xl font-bold text-ink/10 select-none">
              {listing.title.charAt(0)}
            </span>
          </div>
        )}
        {isBU && (
          <Badge className="absolute top-2 left-2 gap-1 rounded-full bg-bu-red px-2 py-0.5 text-[11px] font-bold text-white hover:bg-bu-red">
            <Flame className="size-3" aria-hidden /> BU
          </Badge>
        )}
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-medium">
          {listing.title}
        </h3>

        <div className="flex flex-wrap items-baseline gap-x-2">
          {isBU && (
            <PriceStrike className="text-xs text-muted-foreground line-through decoration-transparent">
              {formatIDR(listing.price)}
            </PriceStrike>
          )}
          <p className="font-display text-xl leading-none font-bold tracking-wide">
            {formatIDR(effectivePrice(listing))}
          </p>
        </div>

        <div className="flex items-center gap-x-2.5 pt-0.5 font-mono text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="size-3" aria-hidden />
            {formatDistance(listing.distance_km)}
          </span>
          {listing.cod_available ? (
            <span className="inline-flex items-center gap-1 font-sans font-medium text-trust-green">
              <span
                className="size-1.5 rounded-full bg-trust-green"
                aria-hidden
              />
              COD sekarang
            </span>
          ) : (
            <span>COD by request</span>
          )}
          <span className="ml-auto inline-flex items-center gap-0.5">
            <Star className="size-3 fill-gold text-gold" aria-hidden />
            {listing.seller_rating.toLocaleString("id-ID")}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function ListingGrid({
  listings,
  className,
}: {
  listings: Listing[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
