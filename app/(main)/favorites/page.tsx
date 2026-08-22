import { Heart } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { ListingGrid } from "@/components/listing/listing-card";
import { MOCK_LISTINGS } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Favorit" };

// ponytail: favorit statis mock — swap ke tabel favorites saat backend nyala
const FAVORITE_IDS = ["lst-001", "lst-004", "lst-006", "lst-009"];

export default function FavoritesPage() {
  const favorites = MOCK_LISTINGS.filter((l) => FAVORITE_IDS.includes(l.id));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">
          Favorit
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          {favorites.length} barang tersimpan
        </p>
      </div>

      {favorites.length > 0 ? (
        <ListingGrid listings={favorites} />
      ) : (
        <EmptyState
          icon={<Heart className="size-8" />}
          title="Belum ada barang favorit"
          description="Tap ikon hati di barang yang menarik biar gak hilang pas dicari lagi."
          actionLabel="Cari barang sekitar"
          actionHref="/search"
        />
      )}
    </div>
  );
}
