"use client";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/client/api";
interface Product {
  code: string;
  name: string;
  duration_hours: number;
  price_idr: number;
  active: boolean;
}
export default function Page() {
  const [rows, setRows] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      apiFetch<{ items: Product[] }>("/api/admin/boost/products")
        .then((data) => setRows(data.items))
        .catch((cause) => setError(cause.message)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function save(row: Product, patch: Partial<Product>) {
    setError("");
    try {
      await apiFetch(`/api/admin/boost/products/${row.code}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal");
    }
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Boost</h1>
        <p className="font-mono text-xs text-muted-foreground">
          Produk dan harga boost database
        </p>
      </div>
      {error && <p className="text-sm text-bu-red-deep">{error}</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {rows.map((row) => (
          <div key={row.code} className="rounded-xl border bg-card p-5">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{row.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {row.duration_hours} jam
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full">
                {row.active ? "🚀 Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <div className="relative mt-4">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                defaultValue={row.price_idr}
                className="pl-11 font-mono"
                onBlur={(event) => {
                  const price = Number(event.target.value.replace(/\D/g, ""));
                  if (price !== row.price_idr)
                    void save(row, { price_idr: price });
                }}
              />
            </div>
            <Button
              variant={row.active ? "outline" : "default"}
              size="sm"
              className="mt-4 w-full rounded-full"
              onClick={() => void save(row, { active: !row.active })}
            >
              {row.active ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
