/**
 * Tipe baris DB untuk integrasi frontend nanti (fase terpisah).
 * Sengaja file baru — TIDAK menyentuh lib/types.ts milik mock frontend.
 */

export type SaleTypeDB = "NORMAL" | "BU";
export type ListingCondition = "baru" | "seperti_baru" | "baik" | "layak_pakai";
export type ListingStatusDB = "active" | "inactive" | "sold" | "removed";

export interface ListingPublicRow {
  id: string;
  seller_id: string;
  category_slug: string;
  category_name: string;
  title: string;
  description: string;
  condition: ListingCondition;
  normal_price: number;
  bu_price: number | null;
  effective_sale_type: SaleTypeDB;
  status: ListingStatusDB;
  cod_available: boolean;
  area_label: string;
  approx_lat: number;
  approx_lng: number;
  boosted_until: string | null;
  views: number;
  created_at: string;
}

/** Baris hasil search_listings() — skor komponenal tersedia utk mode explain (PRD §21). */
export interface SearchListingRow extends Omit<
  ListingPublicRow,
  "category_name"
> {
  seller_name: string;
  seller_rating: number;
  distance_km: number | null;
  score: {
    relevance: number;
    distance: number;
    bu_score: number;
    price_score: number;
    freshness: number;
    seller_reputation: number;
    cod_score: number;
    boost_score: number;
    total: number;
  };
}

export type CodState =
  | "accepted"
  | "scheduled"
  | "otw"
  | "near_location"
  | "arrived"
  | "item_check"
  | "completed"
  | "cancelled"
  | "no_show"
  | "disputed"
  | "expired";

export type TrxStatus =
  | "pending"
  | "in_progress"
  | "item_check"
  | "completed"
  | "cancelled"
  | "no_show"
  | "disputed";

export interface CodSessionRow {
  id: string;
  request_id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  state: CodState;
  meeting_point: string;
  scheduled_at: string;
  sharing_enabled: boolean;
  last_location_at: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface TransactionRow {
  id: string;
  session_id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  agreed_price: number;
  status: TrxStatus;
  created_at: string;
  completed_at: string | null;
}
