export type SaleType = "NORMAL" | "BU";

export type Condition = "baru" | "seperti_baru" | "baik" | "layak_pakai";

export interface Category {
  id: string;
  slug: string;
  name: string;
}

export interface SellerProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  rating: number;
  completed_transactions: number;
  verified: boolean;
  member_since: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_slug: string;
  condition: Condition;
  price: number;
  bu_price: number | null;
  sale_type: SaleType;
  bu_expires_at: string | null;
  images: string[];
  area_label: string;
  distance_km: number;
  cod_available: boolean;
  seller_rating: number;
  seller: SellerProfile;
  views: number;
  status: "active" | "sold" | "inactive";
  boosted: boolean;
  created_at: string;
}

export type MessageType =
  "text" | "image" | "system" | "location" | "cod_action";

export interface Message {
  id: string;
  sender_id: string;
  type: MessageType;
  body: string;
  image_url?: string | null;
  cod_status?: "requested" | "accepted" | "rejected";
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  participant_id: string;
  last_message: string;
  unread_count: number;
  updated_at: string;
}
