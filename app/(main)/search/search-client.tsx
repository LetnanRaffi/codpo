"use client";

import { Flame, SearchX, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import {
  ListingCard,
  ListingCardSkeleton,
} from "@/components/listing/listing-card";
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
import type { Category, Condition, Listing } from "@/lib/types";

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

function FilterPanel({
  filters,
  setFilters,
  categories,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  categories: Category[];
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
          {categories.map((c) => (
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
              setFilters({
                ...filters,
                minPrice: e.target.value.replace(/\D/g, ""),
              })
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
              setFilters({
                ...filters,
                maxPrice: e.target.value.replace(/\D/g, ""),
              })
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

type SearchRow = Record<string, unknown>;

function mapRow(row: SearchRow): Listing {
  const sellerId = String(row.seller_id ?? "");
  const rating = Number(row.seller_rating ?? 0);
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description ?? ""),
    category_id: "",
    category_slug: String(row.category_slug ?? "lainnya"),
    condition: String(row.condition ?? "baik") as Condition,
    price: Number(row.normal_price ?? 0),
    bu_price: row.bu_price == null ? null : Number(row.bu_price),
    sale_type: String(row.effective_sale_type ?? "NORMAL") as "NORMAL" | "BU",
    bu_expires_at: null,
    images: Array.isArray(row.images) ? row.images.map(String) : [],
    area_label: String(row.area_label ?? "Indonesia"),
    distance_km: Number(row.distance_km ?? 0),
    cod_available: Boolean(row.cod_available),
    seller_rating: rating,
    seller: {
      id: sellerId,
      name: String(row.seller_name ?? "Pengguna CODPO"),
      avatar_url: null,
      rating,
      completed_transactions: 0,
      verified: false,
      member_since: String(row.created_at).slice(0, 7),
    },
    views: 0,
    status: "active",
    boosted: Boolean(row.boosted),
    created_at: String(row.created_at),
  };
}

export function SearchClient({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { radiusKm, position } = useRadius();
  const q = searchParams.get("q") ?? "";
  const initialSort = searchParams.get("sort");
  const [sort, setSort] = useState<SortKey>(
    SORTS.some((item) => item.value === initialSort)
      ? (initialSort as SortKey)
      : "recommended",
  );
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    categorySlug: searchParams.get("category_slug") ?? "",
    condition: (searchParams.get("condition") as Condition | null) ?? "",
    minPrice: searchParams.get("min_price") ?? "",
    maxPrice: searchParams.get("max_price") ?? "",
    buOnly: searchParams.get("bu") === "1",
    codOnly: searchParams.get("cod_only") === "true",
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const minPrice = filters.minPrice ? Number(filters.minPrice) : null;
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;
  const priceError =
    minPrice !== null && maxPrice !== null && minPrice > maxPrice
      ? "Harga minimum tidak boleh lebih besar dari harga maksimum."
      : "";

  useEffect(() => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (sort !== "recommended") query.set("sort", sort);
    if (filters.categorySlug) query.set("category_slug", filters.categorySlug);
    if (filters.condition) query.set("condition", filters.condition);
    if (filters.minPrice) query.set("min_price", filters.minPrice);
    if (filters.maxPrice) query.set("max_price", filters.maxPrice);
    if (filters.buOnly) query.set("bu", "1");
    if (filters.codOnly) query.set("cod_only", "true");
    const next = query.size ? `${pathname}?${query}` : pathname;
    router.replace(next, { scroll: false });
  }, [filters, pathname, q, router, sort]);

  useEffect(() => {
    const controller = new AbortController();
    if (priceError) return () => controller.abort();
    const query = new URLSearchParams({ sort, limit: "50" });
    if (q) query.set("q", q);
    if (filters.categorySlug) query.set("category_slug", filters.categorySlug);
    if (filters.condition) query.set("condition", filters.condition);
    if (filters.minPrice) query.set("min_price", filters.minPrice);
    if (filters.maxPrice) query.set("max_price", filters.maxPrice);
    if (filters.buOnly) query.set("bu_only", "true");
    if (filters.codOnly) query.set("cod_only", "true");
    if (position) {
      query.set("lat", String(position.lat));
      query.set("lng", String(position.lng));
      query.set("radius_m", String(radiusKm * 1000));
    }
    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError("");
        return fetch(`/api/listings?${query}`, { signal: controller.signal });
      })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok) {
          throw new Error(
            payload?.error ?? `Pencarian gagal (${response.status})`,
          );
        }
        return payload;
      })
      .then((payload) => setResults(payload.data.items.map(mapRow)))
      .catch((cause) => {
        if (cause.name !== "AbortError") {
          setResults([]);
          setError(cause instanceof Error ? cause.message : "Pencarian gagal");
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [q, filters, sort, radiusKm, position, priceError]);
  const activeFilterCount =
    (filters.categorySlug ? 1 : 0) +
    (filters.condition ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.buOnly ? 1 : 0) +
    (filters.codOnly ? 1 : 0);

  const filterPanel = (
    <FilterPanel
      filters={filters}
      setFilters={setFilters}
      categories={categories}
    />
  );

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide uppercase md:text-3xl">
              {q ? `Hasil "${q}"` : "Jelajahi Barang"}
            </h1>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {loading && !priceError ? "Mencari…" : `${results.length} barang`}{" "}
              · radius {radiusKm} km
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

        {loading && !priceError ? (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            aria-label="Memuat hasil pencarian"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <ListingCardSkeleton key={index} />
            ))}
          </div>
        ) : error || priceError ? (
          <EmptyState
            icon={<SearchX className="size-8" />}
            title="Pencarian gagal dimuat"
            description={error || priceError}
            actionLabel={priceError ? "Hapus filter harga" : "Coba lagi"}
            onAction={() =>
              priceError
                ? setFilters({ ...filters, minPrice: "", maxPrice: "" })
                : setFilters({ ...filters })
            }
          />
        ) : results.length > 0 ? (
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
