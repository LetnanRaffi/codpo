import type { Metadata } from "next";
import { Suspense } from "react";

import { ListingCardSkeleton } from "@/components/listing/listing-card";
import { SearchClient } from "@/app/(main)/search/search-client";
import { getCategories } from "@/lib/server/marketplace";

export const metadata: Metadata = { title: "Cari Barang" };

function SearchFallback() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function SearchPage() {
  const categories = await getCategories();
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient categories={categories} />
    </Suspense>
  );
}
