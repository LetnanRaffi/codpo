import { ListingCardSkeleton } from "@/components/listing/listing-card";

export default function MainLoading() {
  return (
    <div aria-busy="true" aria-label="Memuat barang" className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
