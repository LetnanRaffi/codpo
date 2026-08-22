"use client";

import {
  CheckCircle2,
  MapPin,
  MessageSquare,
  Navigation,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";
import { BUYER_TRANSACTIONS } from "@/lib/mock/seller";
import { MOCK_LISTINGS } from "@/lib/mock/data";
import type { BuyerTransactionRow } from "@/lib/mock/seller";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "aktif", label: "COD Aktif" },
  { key: "selesai", label: "Selesai" },
  { key: "batal", label: "Batal" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STEPS = ["Deal", "Terjadwal", "OTW", "Sampai", "Selesai"] as const;

function stepIndex(row: BuyerTransactionRow): number {
  switch (row.cod_status) {
    case "scheduled":
      return 1;
    case "otw":
      return 2;
    case "arrived":
      return 3;
    case "completed":
      return 4;
    default:
      return 0;
  }
}

function CodStepper({ row }: { row: BuyerTransactionRow }) {
  const current = stepIndex(row);
  const done = row.cod_status === "completed";

  return (
    <ol aria-label="Status COD" className="flex items-center gap-1">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 flex-col items-center gap-1">
          <span
            className={cn(
              "size-2 rounded-full",
              i < current || done
                ? "bg-trust-green"
                : i === current
                  ? "bg-bu-red ring-3 ring-bu-red/20"
                  : "bg-muted-foreground/25",
            )}
            aria-hidden
          />
          <span
            className={cn(
              "text-[9px] leading-none whitespace-nowrap",
              i <= current || done
                ? "text-foreground"
                : "text-muted-foreground/60",
            )}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function TransactionCard({ row }: { row: BuyerTransactionRow }) {
  const listing = MOCK_LISTINGS.find((l) => l.id === row.listing_id);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex gap-3">
        <Link
          href={`/listing/${row.listing_id}`}
          aria-hidden
          tabIndex={-1}
          className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-paper-soft font-display text-2xl font-bold text-ink/30"
        >
          {(listing?.title ?? "?").charAt(0)}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/listing/${row.listing_id}`}
            className="line-clamp-1 text-sm font-semibold hover:underline"
          >
            {listing?.title ?? "Listing"}
          </Link>
          <p className="text-xs text-muted-foreground">
            Seller: {row.seller_name}
          </p>
          <p className="mt-0.5 font-display text-lg font-bold tracking-wide">
            {formatIDR(row.agreed_price)}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={cn(
            "h-fit shrink-0 rounded-full capitalize",
            row.status === "completed" && "bg-trust-green/15 text-trust-green",
            row.status === "cancelled" && "opacity-60",
            (row.status === "item_check" || row.cod_status === "otw") &&
              "bg-bu-red/10 text-bu-red-deep",
          )}
        >
          {row.cod_status === "otw"
            ? "Seller OTW"
            : row.cod_status === "arrived"
              ? "Sampai lokasi"
              : row.cod_status}
        </Badge>
      </div>

      {row.cod_status !== "cancelled" && row.cod_status !== "completed" ? (
        <>
          <CodStepper row={row} />
          <div className="mt-3 space-y-1 rounded-lg bg-paper-soft/70 px-3 py-2 font-mono text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-bu-red" aria-hidden />
              <span className="truncate">{row.meeting_point}</span>
            </p>
            <p className="flex items-center gap-1.5 tabular-nums">
              <Navigation className="size-3.5 shrink-0" aria-hidden />
              {new Date(`${row.date}T${row.time}`).toLocaleString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 rounded-full"
              asChild
            >
              <Link href="/chat">
                <MessageSquare aria-hidden /> Chat seller
              </Link>
            </Button>
            {row.status === "item_check" ? (
              <Button size="sm" className="flex-1 rounded-full font-bold">
                Selesaikan Transaksi
              </Button>
            ) : row.cod_status === "otw" ? (
              <Button
                size="sm"
                disabled
                className="flex-1 rounded-full font-bold"
              >
                📍 Live tracking menyusul
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <p
          className={cn(
            "mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs",
            row.status === "completed"
              ? "bg-trust-green/10 text-trust-green"
              : "text-muted-foreground",
          )}
        >
          {row.status === "completed" ? (
            <>
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />{" "}
              Transaksi selesai — jangan lupa kasih rating
            </>
          ) : (
            <>
              <XCircle className="size-3.5 shrink-0" aria-hidden /> COD
              dibatalkan — uang gak berpindah, tenang.
            </>
          )}
        </p>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  const [tab, setTab] = useState<TabKey>("aktif");

  const rows = BUYER_TRANSACTIONS.filter((r) => {
    if (tab === "aktif") return !["completed", "cancelled"].includes(r.status);
    if (tab === "selesai") return r.status === "completed";
    return r.status === "cancelled";
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">
          Transaksi
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Semua COD kamu — data demo
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Filter transaksi"
        className="flex gap-1.5"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              tab === t.key
                ? "border-foreground bg-secondary font-semibold"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rows.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((row) => (
            <TransactionCard key={row.id} row={row} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            <Image
              src="/logo-codpo.png"
              alt=""
              width={40}
              height={40}
              className="opacity-30"
            />
          }
          title={
            tab === "aktif"
              ? "Gak ada COD yang jalan"
              : tab === "selesai"
                ? "Belum ada transaksi selesai"
                : "Gak ada transaksi batal"
          }
          description={
            tab === "aktif"
              ? "Ajukan COD di barang yang kamu suka, statusnya muncul di sini."
              : "Mulai dari halaman utama — banyak barang BU murah nunggu."
          }
          actionLabel="Cari barang sekitar"
          actionHref="/search"
        />
      )}
    </div>
  );
}
