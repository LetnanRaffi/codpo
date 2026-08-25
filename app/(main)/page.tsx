import {
  Armchair,
  Bike,
  Camera,
  ChevronRight,
  Flame,
  Gamepad2,
  Home as HomeIcon,
  Laptop,
  Package,
  Puzzle,
  Shirt,
  Smartphone,
  Footprints,
  Tv,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing/listing-card";
import { SectionRow } from "@/components/section-row";
import { effectivePrice } from "@/lib/listing";
import { getCategories, searchListings } from "@/lib/server/marketplace";

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "hp-tablet": Smartphone,
  "laptop-komputer": Laptop,
  elektronik: Tv,
  gaming: Gamepad2,
  kamera: Camera,
  fashion: Shirt,
  sepatu: Footprints,
  kendaraan: Bike,
  furniture: Armchair,
  rumah: HomeIcon,
  hobi: Puzzle,
  lainnya: Package,
};

export default async function HomePage() {
  const [categories, listings] = await Promise.all([
    getCategories(),
    searchListings({ limit: 48 }),
  ]);
  const buTerdekat = listings
    .filter((l) => l.sale_type === "BU")
    .sort((a, b) => a.distance_km - b.distance_km);
  const baruDitambahkan = [...listings].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  );
  const hargaMenarik = [...listings].sort(
    (a, b) => effectivePrice(a) - effectivePrice(b),
  );

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold tracking-wide uppercase">
            <Flame className="size-5 text-bu-red" aria-hidden />
            BU Terdekat
          </h2>
          <Link
            href="/search?bu=1"
            className="inline-flex shrink-0 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Lihat semua
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        {buTerdekat.length > 0 ? (
          <div className="flex [scrollbar-width:none] gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            {buTerdekat.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                className="w-44 shrink-0 sm:w-52"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Flame className="size-8" />}
            title="Belum ada listing BU di radius ini"
            description="Coba perlebar radius, atau jadi yang pertama pasang barang BU di sekitarmu."
            actionLabel="Jual barang sekarang"
            actionHref="/sell"
          />
        )}
      </section>

      <SectionRow title="Baru Ditambahkan" seeAllHref="/search">
        {baruDitambahkan.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            className="w-44 shrink-0 sm:w-52"
          />
        ))}
      </SectionRow>

      <SectionRow title="Harga Menarik" seeAllHref="/search?sort=termurah">
        {hargaMenarik.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            className="w-44 shrink-0 sm:w-52"
          />
        ))}
      </SectionRow>

      <section id="kategori" className="scroll-mt-20 space-y-3">
        <h2 className="font-display text-2xl font-bold tracking-wide uppercase">
          Kategori
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? Package;
            return (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="flex flex-col items-center gap-1.5 rounded-xl border bg-card px-2 py-3.5 transition-colors hover:bg-accent"
              >
                <Icon className="size-5 text-muted-foreground" aria-hidden />
                <span className="text-center text-[11px] leading-tight font-medium sm:text-xs">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold tracking-wide uppercase">
          Semua Barang
        </h2>
        {listings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Belum ada barang sama sekali"
            description="Jadi seller pertama di CODPO — barangmu tampil duluan di sini."
            actionLabel="Pasang Listing"
            actionHref="/sell"
          />
        )}
      </section>
    </div>
  );
}
