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
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { CodSessionActions } from "@/components/listing/cod-session-actions";
import { ReviewDialog } from "@/components/listing/review-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";
import { apiFetch } from "@/lib/client/api";
import { cn } from "@/lib/utils";

interface BuyerTransactionRow {
  id: string;
  listing_id: string;
  listing_title: string;
  other_user_name: string;
  agreed_price: number;
  status: string;
  created_at: string;
  cod_sessions: {
    id: string;
    state: string;
    scheduled_at: string;
    meeting_point: string;
  } | null;
}

const TABS = [
  { key: "aktif", label: "COD Aktif" },
  { key: "selesai", label: "Selesai" },
  { key: "batal", label: "Batal" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STEPS = ["Deal", "Terjadwal", "OTW", "Sampai", "Selesai"] as const;

function stepIndex(row: BuyerTransactionRow): number {
  switch (row.cod_sessions?.state) {
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
  const done = row.cod_sessions?.state === "completed";

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

function TransactionCard({
  row,
  onUpdated,
}: {
  row: BuyerTransactionRow;
  onUpdated: () => void;
}) {
  const codStatus = row.cod_sessions?.state ?? "accepted";

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex gap-3">
        <Link
          href={`/listing/${row.listing_id}`}
          aria-hidden
          tabIndex={-1}
          className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-paper-soft font-display text-2xl font-bold text-ink/30"
        >
          {row.listing_title.charAt(0)}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/listing/${row.listing_id}`}
            className="line-clamp-1 text-sm font-semibold hover:underline"
          >
            {row.listing_title}
          </Link>
          <p className="text-xs text-muted-foreground">
            Seller: {row.other_user_name}
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
            (row.status === "item_check" || codStatus === "otw") &&
              "bg-bu-red/10 text-bu-red-deep",
          )}
        >
          {codStatus === "otw"
            ? "Seller OTW"
            : codStatus === "arrived"
              ? "Sampai lokasi"
              : codStatus}
        </Badge>
      </div>

      {codStatus !== "cancelled" && codStatus !== "completed" ? (
        <>
          <CodStepper row={row} />
          <div className="mt-3 space-y-1 rounded-lg bg-paper-soft/70 px-3 py-2 font-mono text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-bu-red" aria-hidden />
              <span className="truncate">
                {row.cod_sessions?.meeting_point}
              </span>
            </p>
            <p className="flex items-center gap-1.5 tabular-nums">
              <Navigation className="size-3.5 shrink-0" aria-hidden />
              {new Date(
                row.cod_sessions?.scheduled_at ?? row.created_at,
              ).toLocaleString("id-ID", {
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
          </div>
          {row.cod_sessions?.id && (
            <div className="mt-3">
              <CodSessionActions
                sessionId={row.cod_sessions.id}
                state={codStatus}
                role="buyer"
                onUpdated={onUpdated}
              />
            </div>
          )}
        </>
      ) : (
        <div
          className={cn(
            "mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs",
            row.status === "completed"
              ? "bg-trust-green/10 text-trust-green"
              : "text-muted-foreground",
          )}
        >
          {row.status === "completed" ? (
            <div className="flex w-full items-center justify-between gap-2">
              <span>
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />{" "}
                Transaksi selesai — jangan lupa kasih rating
              </span>
              <ReviewDialog transactionId={row.id} />
            </div>
          ) : (
            <>
              <XCircle className="size-3.5 shrink-0" aria-hidden /> COD
              dibatalkan — uang gak berpindah, tenang.
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("aktif");
  const [allRows, setAllRows] = useState<BuyerTransactionRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, loading } = useAuth();
  const load = useCallback(async () => {
    setDataLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ items: BuyerTransactionRow[] }>(
        "/api/transactions",
      );
      setAllRows(data.items);
    } catch (cause) {
      setAllRows([]);
      setError(
        cause instanceof Error ? cause.message : "Gagal memuat transaksi",
      );
    } finally {
      setDataLoading(false);
    }
  }, []);
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/transactions");
      return;
    }
    queueMicrotask(() => void load());
  }, [load, loading, router, user]);

  if (loading || !user)
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Memuat transaksi…
      </p>
    );

  const rows = allRows.filter((r) => {
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
          Semua COD kamu
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

      {dataLoading ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Memuat transaksi…
        </p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-bu-red/30 bg-bu-red/5 p-5 text-sm text-bu-red-deep"
        >
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-full"
            onClick={() => void load()}
          >
            Coba lagi
          </Button>
        </div>
      ) : rows.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((row) => (
            <TransactionCard key={row.id} row={row} onUpdated={load} />
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
