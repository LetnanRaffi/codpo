export const SELLER_STATS = {
  active_listings: 6,
  total_listings: 14,
  sold: 8,
  views_7d: 412,
  cod_requests_open: 3,
  completed_transactions: 23,
  rating: 4.9,
} as const;

export interface SellerTransactionRow {
  id: string;
  listing_title: string;
  buyer: string;
  date: string;
  cod_status: "scheduled" | "otw" | "arrived" | "completed" | "cancelled";
  status: "pending" | "in_progress" | "item_check" | "completed" | "cancelled";
}

export const SELLER_TRANSACTIONS: SellerTransactionRow[] = [
  {
    id: "trx-301",
    listing_title: "Meja belajar minimalis kayu jati",
    buyer: "Rangga D.",
    date: "2026-08-22",
    cod_status: "arrived",
    status: "item_check",
  },
  {
    id: "trx-299",
    listing_title: "iPhone 13 128GB mulus fullset",
    buyer: "Nadia P.",
    date: "2026-08-22",
    cod_status: "otw",
    status: "in_progress",
  },
  {
    id: "trx-285",
    listing_title: "Rice cooker Miyako 1.8L",
    buyer: "Sinta M.",
    date: "2026-08-19",
    cod_status: "completed",
    status: "completed",
  },
  {
    id: "trx-271",
    listing_title: "Jaket denim Levi's original size M",
    buyer: "Yoga S.",
    date: "2026-08-15",
    cod_status: "completed",
    status: "completed",
  },
  {
    id: "trx-260",
    listing_title: "PS4 Slim 500GB + 2 stick",
    buyer: "Andre W.",
    date: "2026-08-11",
    cod_status: "cancelled",
    status: "cancelled",
  },
];
