import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category, Condition, Listing, SaleType } from "@/lib/types";

type Row = Record<string, unknown>;

export function publicObjectUrl(key: string) {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base ? `${base}/${key}` : "";
}

export function listingFromRow(
  row: Row,
  extra: Partial<Listing> = {},
): Listing {
  const sellerName = String(
    row.seller_name ?? extra.seller?.name ?? "Pengguna CODPO",
  );
  const sellerId = String(row.seller_id ?? extra.seller?.id ?? "");
  const saleType = String(
    row.effective_sale_type ?? row.sale_type ?? "NORMAL",
  ) as SaleType;
  return {
    id: String(row.id),
    title: String(row.title ?? "Listing"),
    description: String(row.description ?? ""),
    category_id: String(row.category_id ?? ""),
    category_slug: String(row.category_slug ?? "lainnya"),
    condition: String(row.condition ?? "baik") as Condition,
    price: Number(row.normal_price ?? 0),
    bu_price: row.bu_price == null ? null : Number(row.bu_price),
    sale_type: saleType,
    bu_expires_at: row.bu_expires_at == null ? null : String(row.bu_expires_at),
    images: extra.images ?? [],
    area_label: String(row.area_label ?? "Indonesia"),
    distance_km: row.distance_km == null ? 0 : Number(row.distance_km),
    cod_available: Boolean(row.cod_available),
    seller_rating: Number(row.seller_rating ?? extra.seller?.rating ?? 0),
    seller: extra.seller ?? {
      id: sellerId,
      name: sellerName,
      avatar_url: null,
      rating: Number(row.seller_rating ?? 0),
      completed_transactions: 0,
      verified: false,
      member_since: String(row.created_at ?? new Date().toISOString()).slice(
        0,
        7,
      ),
    },
    views: Number(row.views ?? 0),
    status:
      String(row.status ?? "active") === "sold"
        ? "sold"
        : String(row.status ?? "active") === "inactive"
          ? "inactive"
          : "active",
    boosted: Boolean(
      row.boosted ??
      (row.boosted_until && new Date(String(row.boosted_until)) > new Date()),
    ),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getCategories(): Promise<Category[]> {
  const db = await createClient();
  const { data } = await db
    .from("categories")
    .select("id,slug,name")
    .eq("active", true)
    .order("sort_order");
  return (data ?? []) as Category[];
}

export async function searchListings(
  options: {
    q?: string | null;
    category?: string | null;
    condition?: Condition | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    buOnly?: boolean;
    codOnly?: boolean;
    lat?: number | null;
    lng?: number | null;
    radiusM?: number | null;
    sort?: string;
    limit?: number;
  } = {},
): Promise<Listing[]> {
  const db = await createClient();
  const { data, error } = await db.rpc("search_listings", {
    p_q: options.q ?? null,
    p_category_slug: options.category ?? null,
    p_condition: options.condition ?? null,
    p_min_price: options.minPrice ?? null,
    p_max_price: options.maxPrice ?? null,
    p_bu_only: options.buOnly ?? false,
    p_cod_only: options.codOnly ?? false,
    p_lat: options.lat ?? null,
    p_lng: options.lng ?? null,
    p_radius_m: options.radiusM ?? null,
    p_sort: options.sort ?? "recommended",
    p_limit: options.limit ?? 24,
    p_offset: 0,
  });
  if (error) {
    console.error("[marketplace.search]", error.message);
    return [];
  }
  const rows = (data ?? []) as Row[];
  const ids = rows.map((row) => String(row.id));
  const imageMap = new Map<string, string[]>();
  if (ids.length) {
    const { data: images } = await db
      .from("listing_images")
      .select("listing_id,object_key,position")
      .in("listing_id", ids)
      .order("position");
    for (const image of images ?? []) {
      const url = publicObjectUrl(String(image.object_key));
      if (url)
        imageMap.set(image.listing_id, [
          ...(imageMap.get(image.listing_id) ?? []),
          url,
        ]);
    }
  }
  return rows.map((row) =>
    listingFromRow(row, { images: imageMap.get(String(row.id)) ?? [] }),
  );
}

export async function getListing(id: string): Promise<Listing | null> {
  const db = await createClient();
  const { data: row } = await db
    .from("listing_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) return null;
  const [{ data: images }, { data: profile }, { data: reputation }] =
    await Promise.all([
      db
        .from("listing_images")
        .select("object_key,position")
        .eq("listing_id", id)
        .order("position"),
      db
        .from("profiles")
        .select("id,name,avatar_key,verified,created_at")
        .eq("id", row.seller_id)
        .maybeSingle(),
      db
        .from("user_reputation")
        .select("avg_rating,completed_transactions")
        .eq("user_id", row.seller_id)
        .maybeSingle(),
    ]);
  const seller = {
    id: String(row.seller_id),
    name: profile?.name ?? "Pengguna CODPO",
    avatar_url: profile?.avatar_key
      ? publicObjectUrl(profile.avatar_key)
      : null,
    rating: Number(reputation?.avg_rating ?? 0),
    completed_transactions: Number(reputation?.completed_transactions ?? 0),
    verified: Boolean(profile?.verified),
    member_since: String(profile?.created_at ?? row.created_at).slice(0, 7),
  };
  return listingFromRow(row as Row, {
    seller,
    images: (images ?? [])
      .map((image) => publicObjectUrl(image.object_key))
      .filter(Boolean),
  });
}

/** Catat view secara atomik. Dipanggil hanya dari render halaman detail, bukan metadata. */
export async function recordListingView(id: string): Promise<void> {
  const db = await createClient();
  const { error } = await db.rpc("increment_listing_views", { p_id: id });
  if (error) console.error("[marketplace.view]", error.message);
}
