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

export interface BuyerTransactionRow {
  id: string;
  listing_id: string;
  seller_name: string;
  agreed_price: number;
  meeting_point: string;
  date: string;
  time: string;
  cod_status: "scheduled" | "otw" | "arrived" | "completed" | "cancelled";
  status: "pending" | "in_progress" | "item_check" | "completed" | "cancelled";
}

export const BUYER_TRANSACTIONS: BuyerTransactionRow[] = [
  {
    id: "trx-401",
    listing_id: "lst-001",
    seller_name: "Dedi Kurnia",
    agreed_price: 4800000,
    meeting_point: "Depan McDonald's Alun-alun Bekasi",
    date: "2026-08-22",
    time: "15:00",
    cod_status: "otw",
    status: "in_progress",
  },
  {
    id: "trx-402",
    listing_id: "lst-006",
    seller_name: "Rika Handayani",
    agreed_price: 550000,
    meeting_point: "Rumah seller — Blok C2 Bekasi Barat",
    date: "2026-08-22",
    time: "19:00",
    cod_status: "arrived",
    status: "item_check",
  },
  {
    id: "trx-397",
    listing_id: "lst-003",
    seller_name: "Yoga Saputra",
    agreed_price: 2200000,
    meeting_point: "Stasiun Bekasi Timur",
    date: "2026-08-24",
    time: "13:30",
    cod_status: "scheduled",
    status: "in_progress",
  },
  {
    id: "trx-388",
    listing_id: "lst-009",
    seller_name: "Wulan Sari",
    agreed_price: 1250000,
    meeting_point: "Kopi Kenangan depan Stasiun",
    date: "2026-08-12",
    time: "10:00",
    cod_status: "completed",
    status: "completed",
  },
  {
    id: "trx-370",
    listing_id: "lst-005",
    seller_name: "Meli Anggraini",
    agreed_price: 350000,
    meeting_point: "Summarecon Mall Bekasi, food court L2",
    date: "2026-08-02",
    time: "16:00",
    cod_status: "completed",
    status: "completed",
  },
  {
    id: "trx-350",
    listing_id: "lst-007",
    seller_name: "Fajar Ramadhan",
    agreed_price: 1400000,
    meeting_point: "Margo City Depok, lobi utama",
    date: "2026-07-28",
    time: "14:00",
    cod_status: "cancelled",
    status: "cancelled",
  },
];
