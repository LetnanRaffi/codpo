"use client";

import { Flame, SearchX, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing/listing-card";
import { useRadius } from "@/components/providers/radius-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { effectivePrice } from "@/lib/listing";
import { CATEGORIES, MOCK_LISTINGS } from "@/lib/mock/data";
import type { Condition, Listing } from "@/lib/types";

const CONDITIONS: { value: Condition | ""; label: string }[] = [
  { value: "", label: "Semua kondisi" },
  { value: "baru", label: "Baru" },
  { value: "seperti_baru", label: "Seperti baru" },
  { value: "baik", label: "Baik" },
  { value: "layak_pakai", label: "Layak pakai" },
];

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "terdekat", label: "Terdekat" },
  { value: "terbaru", label: "Terbaru" },
  { value: "termurah", label: "Termurah" },
  { value: "termahal", label: "Termahal" },
] as const;

type SortKey = (typeof SORTS)[number]["value"];

interface Filters {
  categorySlug: string;
  condition: Condition | "";
  minPrice: string;
  maxPrice: string;
  buOnly: boolean;
  codOnly: boolean;
}

const EMPTY_FILTERS: Filters = {
  categorySlug: "",
  condition: "",
  minPrice: "",
  maxPrice: "",
  buOnly: false,
  codOnly: false,
};

// ponytail: skor deterministic sederhana (jarak dominan + BU + rating + boost);
// ganti ranking PRD §21 penuh saat data asli + PostGIS masuk
function recommendedScore(l: Listing): number {
  return (
    -l.distance_km * 2 +
    (l.sale_type === "BU" ? 3 : 0) +
    l.seller_rating +
    (l.boosted ? 2 : 0)
  );
}

function applyFilters(
  q: string,
  radiusKm: number,
  f: Filters,
  sort: SortKey,
): Listing[] {
  const keyword = q.trim().toLowerCase();
  const min = Number(f.minPrice) || 0;
  const max = Number(f.maxPrice) || Infinity;

  const result = MOCK_LISTINGS.filter((l) => {
    if (
      keyword &&
      !`${l.title} ${l.description}`.toLowerCase().includes(keyword)
    )
      return false;
    if (f.categorySlug && l.category_slug !== f.categorySlug) return false;
    if (l.distance_km > radiusKm) return false;
    const price = effectivePrice(l);
    if (price < min || price > max) return false;
    if (f.buOnly && l.sale_type !== "BU") return false;
    if (f.codOnly && !l.cod_available) return false;
    if (f.condition && l.condition !== f.condition) return false;
    return true;
  });

  switch (sort) {
    case "terdekat":
      return result.sort((a, b) => a.distance_km - b.distance_km);
    case "terbaru":
      return result.sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      );
    case "termurah":
      return result.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case "termahal":
      return result.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    default:
      return result.sort((a, b) => recommendedScore(b) - recommendedScore(a));
  }
}

function FilterPanel({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const { radiusKm } = useRadius();

  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <Label className="text-sm font-semibold">Kategori</Label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilters({ ...filters, categorySlug: "" })}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filters.categorySlug === ""
                ? "border-foreground bg-secondary font-semibold"
                : "hover:bg-accent"
            }`}
          >
            Semua
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setFilters({ ...filters, categorySlug: c.slug })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filters.categorySlug === c.slug
                  ? "border-foreground bg-secondary font-semibold"
                  : "hover:bg-accent"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <Label className="text-sm font-semibold">
          Harga{" "}
          <span className="font-mono text-xs font-normal text-muted-foreground">
            ({radiusKm} km radius aktif dari header)
          </span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            inputMode="numeric"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) =>
              setFilters({ ...filters, minPrice: e.target.value })
            }
            aria-label="Harga minimum"
            className="h-9 rounded-full font-mono text-xs"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            inputMode="numeric"
            placeholder="Maks"
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters({ ...filters, maxPrice: e.target.value })
            }
            aria-label="Harga maksimum"
            className="h-9 rounded-full font-mono text-xs"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">Contoh: 500000</p>
      </div>

      <div className="space-y-2.5">
        <Label className="text-sm font-semibold">Kondisi</Label>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFilters({ ...filters, condition: c.value })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filters.condition === c.value
                  ? "border-foreground bg-secondary font-semibold"
                  : "hover:bg-accent"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2.5 text-sm font-semibold">
          <Checkbox
            checked={filters.buOnly}
            onCheckedChange={(v) => setFilters({ ...filters, buOnly: !!v })}
          />
          <Flame className="size-3.5 text-bu-red" aria-hidden /> Hanya BU
        </Label>
        <Label className="flex items-center gap-2.5 text-sm font-semibold">
          <Checkbox
            checked={filters.codOnly}
            onCheckedChange={(v) => setFilters({ ...filters, codOnly: !!v })}
          />
          COD sekarang saja
        </Label>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-full"
        onClick={() => setFilters(EMPTY_FILTERS)}
      >
        Hapus semua filter
      </Button>
    </div>
  );
}

export function SearchClient() {
  const searchParams = useSearchParams();
  const { radiusKm } = useRadius();
  const q = searchParams.get("q") ?? "";
  const [sort, setSort] = useState<SortKey>("recommended");
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    buOnly: searchParams.get("bu") === "1",
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  const results = useMemo(
    () => applyFilters(q, radiusKm, filters, sort),
    [q, radiusKm, filters, sort],
  );
  const activeFilterCount =
    (filters.categorySlug ? 1 : 0) +
    (filters.condition ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.buOnly ? 1 : 0) +
    (filters.codOnly ? 1 : 0);

  const filterPanel = <FilterPanel filters={filters} setFilters={setFilters} />;

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide uppercase md:text-3xl">
              {q ? `Hasil "${q}"` : "Jelajahi Barang"}
            </h1>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {results.length} barang · radius {radiusKm} km
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full lg:hidden"
                >
                  <SlidersHorizontal className="size-4" aria-hidden />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1 size-4 justify-center rounded-full p-0 text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
              >
                <SheetHeader>
                  <SheetTitle className="font-display text-xl font-bold tracking-wide uppercase">
                    Filter
                  </SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">
                  {filterPanel}
                  <Button
                    className="mt-6 w-full rounded-full"
                    onClick={() => setSheetOpen(false)}
                  >
                    Lihat {results.length} barang
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full">
                  Urut: {SORTS.find((s) => s.value === sort)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(v) => setSort(v as SortKey)}
                >
                  {SORTS.map((s) => (
                    <DropdownMenuRadioItem key={s.value} value={s.value}>
                      {s.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {results.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<SearchX className="size-8" />}
            title="Gak ada barang yang cocok"
            description={`Tidak ada hasil${q ? ` untuk "${q}"` : ""} di radius ${radiusKm} km dengan filter sekarang. Coba perlebar radius atau hapus beberapa filter.`}
            actionLabel="Hapus semua filter"
            onAction={() => setFilters(EMPTY_FILTERS)}
          />
        )}
      </div>

      <aside className="sticky top-20 hidden w-72 shrink-0 rounded-xl border bg-card p-5 lg:block">
        <p className="mb-5 font-display text-lg font-bold tracking-wide uppercase">
          Filter
        </p>
        {filterPanel}
      </aside>
    </div>
  );
}
