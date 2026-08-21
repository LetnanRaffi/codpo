import { Eye, Flame, Handshake, Package, Rocket, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";
import { MOCK_LISTINGS } from "@/lib/mock/data";
import { SELLER_STATS, SELLER_TRANSACTIONS } from "@/lib/mock/seller";

export const metadata: Metadata = { title: "Dashboard Seller" };

const COD_STATUS_LABEL: Record<string, string> = {
  scheduled: "Terjadwal",
  otw: "OTW",
  arrived: "Sampai",
  completed: "Selesai",
  cancelled: "Batal",
};

const TRX_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "Berjalan",
  item_check: "Cek Barang",
  completed: "Selesai",
  cancelled: "Batal",
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-trust-green text-white";
    case "item_check":
    case "in_progress":
      return "bg-secondary text-foreground";
    case "cancelled":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-gold/20 text-foreground";
  }
}

const STATS = [
  {
    label: "Listing aktif",
    value: SELLER_STATS.active_listings,
    icon: Package,
  },
  { label: "Terjual", value: SELLER_STATS.sold, icon: Handshake },
  { label: "Dilihat (7 hr)", value: SELLER_STATS.views_7d, icon: Eye },
  { label: "COD masuk", value: SELLER_STATS.cod_requests_open, icon: Flame },
  {
    label: "Transaksi selesai",
    value: SELLER_STATS.completed_transactions,
    icon: Rocket,
  },
  {
    label: "Rating",
    value: SELLER_STATS.rating.toLocaleString("id-ID"),
    icon: Star,
  },
];

export default function SellerDashboardPage() {
  const listings = MOCK_LISTINGS.slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">
            Dashboard Seller
          </h1>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            Ringkasan toko kamu — data demo
          </p>
        </div>
        <Button className="rounded-full font-bold" asChild>
          <Link href="/sell">+ Pasang Listing</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STATS.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            <p className="mt-2 font-display text-2xl leading-none font-bold tabular-nums">
              {typeof value === "number"
                ? value.toLocaleString("id-ID")
                : value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Listings table */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold tracking-wide uppercase">
          Listing Kamu
        </h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Barang</th>
                <th className="px-4 py-3 font-medium">Harga</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Dilihat</th>
                <th className="px-4 py-3 font-medium">Boost</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/listing/${l.id}`}
                      className="flex items-center gap-3"
                    >
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-paper-soft font-display text-base font-bold text-ink/30"
                      >
                        {l.title.charAt(0)}
                      </span>
                      <span className="line-clamp-1 max-w-64 font-medium">
                        {l.title}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">
                    {formatIDR(
                      l.sale_type === "BU" && l.bu_price !== null
                        ? l.bu_price
                        : l.price,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={`rounded-full ${l.status === "active" ? "" : "opacity-60"}`}
                    >
                      {l.status === "active"
                        ? "Aktif"
                        : l.status === "sold"
                          ? "Terjual"
                          : "Nonaktif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">
                    {l.views}
                  </td>
                  <td className="px-4 py-3">
                    {l.boosted ? (
                      <Badge className="gap-1 rounded-full bg-gold text-white hover:bg-gold">
                        🚀 Aktif
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full"
                      asChild
                    >
                      <Link href="#">Edit</Link>
                    </Button>
                    {!l.boosted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full text-gold hover:text-gold"
                        asChild
                      >
                        <Link href="#">🚀 Boost</Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full text-bu-red-deep hover:text-bu-red"
                      asChild
                    >
                      <Link href="#">Hapus</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transactions */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold tracking-wide uppercase">
          Transaksi &amp; COD
        </h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Barang</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">COD</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {SELLER_TRANSACTIONS.map((t) => (
                <tr key={t.id} className="hover:bg-accent/50">
                  <td className="max-w-72 truncate px-4 py-3 font-medium">
                    {t.listing_title}
                  </td>
                  <td className="px-4 py-3">{t.buyer}</td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums">
                    {t.date}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {COD_STATUS_LABEL[t.cod_status]}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={`rounded-full ${statusBadgeClass(t.status)}`}
                    >
                      {TRX_STATUS_LABEL[t.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Tabel scroll horizontal di layar kecil — dashboard seller memang
          optimal di desktop.
        </p>
      </section>
    </div>
  );
}
