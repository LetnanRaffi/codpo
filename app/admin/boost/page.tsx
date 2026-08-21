"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOOST_PRODUCTS } from "@/lib/mock/admin";

export default function AdminBoostPage() {
  const [products, setProducts] = useState(BOOST_PRODUCTS);

  function updatePrice(id: string, price: string) {
    setProducts((arr) =>
      arr.map((p) =>
        p.id === id
          ? { ...p, price: Number(price.replace(/\D/g, "")) || 0 }
          : p,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
          Boost
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Produk boost &amp; harga — monetisasi MVP (PRD §39), demo lokal
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {p.duration_hours} jam tayang lebih tinggi
                </p>
              </div>
              {p.active ? (
                <Badge
                  variant="secondary"
                  className="rounded-full bg-gold/20 text-foreground"
                >
                  🚀 Aktif
                </Badge>
              ) : (
                <Badge variant="secondary" className="rounded-full opacity-60">
                  Nonaktif
                </Badge>
              )}
            </div>

            <div className="relative mt-4">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                inputMode="numeric"
                value={p.price || ""}
                onChange={(e) => updatePrice(p.id, e.target.value)}
                aria-label={`Harga ${p.name}`}
                className="rounded-lg pl-11 font-mono tabular-nums"
              />
            </div>

            <Button
              variant={p.active ? "outline" : "default"}
              size="sm"
              className="mt-4 w-full rounded-full"
              onClick={() =>
                setProducts((arr) =>
                  arr.map((x) =>
                    x.id === p.id ? { ...x, active: !x.active } : x,
                  ),
                )
              }
            >
              {p.active ? "Nonaktifkan produk" : "Aktifkan produk"}
            </Button>
          </div>
        ))}
      </div>

      <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
        Boost cuma pengaruh ranking (PRD §21) — gak mengubah harga listing.
        Harga di sini jadi acuan saat pembayaran boost aktif di Fase 8.
      </p>
    </div>
  );
}
