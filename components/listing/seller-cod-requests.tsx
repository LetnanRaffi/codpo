"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/client/api";

interface RequestRow {
  id: string;
  listing_id: string;
  preferred_date: string;
  preferred_time: string;
  meeting_point: string;
  note: string | null;
  status: string;
}

export function SellerCodRequests() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      apiFetch<{ items: RequestRow[] }>("/api/cod/requests?role=seller")
        .then((data) => setRows(data.items))
        .catch(() => setRows([])),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function decide(row: RequestRow, action: "accept" | "reject") {
    setError("");
    try {
      await apiFetch(`/api/cod/requests/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, request_id: row.id }),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal merespons COD");
    }
  }
  const pending = rows.filter((row) => row.status === "requested");
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold tracking-wide uppercase">
        Permintaan COD Masuk
      </h2>
      {error && <p className="text-sm text-bu-red-deep">{error}</p>}
      {pending.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {pending.map((row) => (
            <div key={row.id} className="rounded-xl border bg-card p-4">
              <div className="flex justify-between gap-3">
                <p className="font-semibold">Permintaan baru</p>
                <Badge className="rounded-full">Menunggu</Badge>
              </div>
              <p className="mt-2 text-sm">
                {new Date(
                  `${row.preferred_date}T${row.preferred_time}`,
                ).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {row.meeting_point}
              </p>
              {row.note && (
                <p className="mt-2 rounded-lg bg-muted p-2 text-xs">
                  {row.note}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 rounded-full"
                  onClick={() => void decide(row, "accept")}
                >
                  Terima
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => void decide(row, "reject")}
                >
                  Tolak
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          Belum ada permintaan COD yang menunggu.
        </p>
      )}
    </section>
  );
}
