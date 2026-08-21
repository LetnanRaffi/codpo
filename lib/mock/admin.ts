import type { Listing } from "@/lib/types";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  joined: string;
  listings: number;
  rating: number | null;
  status: "active" | "suspended" | "banned";
}

export const ADMIN_USERS: AdminUserRow[] = [
  {
    id: "sel-01",
    name: "Dedi Kurnia",
    email: "dedi@mail.com",
    joined: "2024-03",
    listings: 12,
    rating: 4.9,
    status: "active",
  },
  {
    id: "usr-102",
    name: "Rangga Dwiputra",
    email: "rangga.d@mail.com",
    joined: "2025-01",
    listings: 0,
    rating: null,
    status: "active",
  },
  {
    id: "sel-07",
    name: "Fajar Ramadhan",
    email: "fajar.r@mail.com",
    joined: "2026-02",
    listings: 4,
    rating: 4.5,
    status: "suspended",
  },
  {
    id: "usr-288",
    name: "Akun Jualan Murah",
    email: "murah.banget@mail.com",
    joined: "2026-06",
    listings: 31,
    rating: 2.1,
    status: "banned",
  },
  {
    id: "sel-06",
    name: "Rika Handayani",
    email: "rika.h@mail.com",
    joined: "2024-01",
    listings: 19,
    rating: 4.8,
    status: "active",
  },
];

export type AdminListingRow = Pick<
  Listing,
  "id" | "title" | "price" | "sale_type" | "views" | "status" | "area_label"
> & { seller: string; reported: boolean };

export const ADMIN_LISTINGS: AdminListingRow[] = [
  {
    id: "lst-001",
    title: "iPhone 13 128GB mulus fullset",
    price: 4800000,
    sale_type: "BU",
    views: 342,
    status: "active",
    area_label: "Bekasi Utara",
    seller: "Dedi Kurnia",
    reported: false,
  },
  {
    id: "lst-004",
    title: "Sony A6000 kit 16-50mm",
    price: 3900000,
    sale_type: "BU",
    views: 96,
    status: "active",
    area_label: "Jakarta Timur",
    seller: "Sari Wulandari",
    reported: true,
  },
  {
    id: "lst-bad-01",
    title: "iPhone 13 BNIB murah banget no minus",
    price: 900000,
    sale_type: "BU",
    views: 2103,
    status: "active",
    area_label: "—",
    seller: "Akun Jualan Murah",
    reported: true,
  },
  {
    id: "lst-010",
    title: "ThinkPad T480 i5-8350U RAM 16GB",
    price: 3400000,
    sale_type: "BU",
    views: 267,
    status: "sold",
    area_label: "Bogor",
    seller: "Rizky Maulana",
    reported: false,
  },
];

export interface AdminReportRow {
  id: string;
  target: string;
  target_ref: string;
  reason: string;
  reporter: string;
  date: string;
  status: "open" | "reviewing" | "resolved";
}

export const ADMIN_REPORTS: AdminReportRow[] = [
  {
    id: "rpt-201",
    target: "Listing",
    target_ref: "iPhone 13 BNIB murah banget…",
    reason: "fake item",
    reporter: "Rangga D.",
    date: "2026-08-21",
    status: "open",
  },
  {
    id: "rpt-200",
    target: "User",
    target_ref: "Akun Jualan Murah",
    reason: "scam",
    reporter: "Nadia P.",
    date: "2026-08-20",
    status: "reviewing",
  },
  {
    id: "rpt-196",
    target: "Listing",
    target_ref: "Sony A6000 kit 16-50mm",
    reason: "misleading listing",
    reporter: "Bagas P.",
    date: "2026-08-18",
    status: "resolved",
  },
];

export interface BoostProductRow {
  id: string;
  name: string;
  duration_hours: number;
  price: number;
  active: boolean;
}

export const BOOST_PRODUCTS: BoostProductRow[] = [
  {
    id: "boost-24h",
    name: "Boost 24 Jam",
    duration_hours: 24,
    price: 4000,
    active: true,
  },
  {
    id: "boost-3d",
    name: "Boost 3 Hari",
    duration_hours: 72,
    price: 8000,
    active: true,
  },
  {
    id: "boost-super",
    name: "Super Boost",
    duration_hours: 168,
    price: 15000,
    active: false,
  },
];
