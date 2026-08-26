"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { apiFetch } from "@/lib/client/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatIDR } from "@/lib/format";

interface BoostProduct {
  code: string;
  name: string;
  duration_hours: number;
  price_idr: number;
}

export function SellerListingActions({
  id,
  boosted,
}: {
  id: string;
  boosted: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [boostOpen, setBoostOpen] = useState(false);
  const [products, setProducts] = useState<BoostProduct[]>([]);
  const [productCode, setProductCode] = useState("");

  async function loadProducts() {
    setError("");
    try {
      const data = await apiFetch<{ items: BoostProduct[] }>(
        "/api/boost/products",
      );
      setProducts(data.items);
      setProductCode((current) => current || data.items[0]?.code || "");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Produk boost gagal dimuat",
      );
    }
  }

  async function run(action: "boost" | "delete", selectedProduct?: string) {
    if (
      action === "delete" &&
      !window.confirm("Hapus listing ini? Aksi ini tidak bisa dibatalkan.")
    )
      return;
    setPending(true);
    setError("");
    try {
      if (action === "boost")
        await apiFetch(`/api/listings/${id}/boost`, {
          method: "POST",
          body: JSON.stringify({ product_code: selectedProduct }),
        });
      else await apiFetch(`/api/listings/${id}`, { method: "DELETE" });
      setBoostOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Aksi gagal");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" className="h-8 rounded-full" asChild>
        <Link href={`/seller/listings/${id}/edit`}>Edit</Link>
      </Button>
      {!boosted && (
        <Dialog
          open={boostOpen}
          onOpenChange={(open) => {
            setBoostOpen(open);
            if (open && products.length === 0) void loadProducts();
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              className="h-8 rounded-full text-gold"
            >
              🚀 Boost
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pilih paket boost</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Boost menaikkan ranking listing selama durasi paket.
            </p>
            <div className="grid gap-2">
              {products.map((product) => (
                <button
                  key={product.code}
                  type="button"
                  onClick={() => setProductCode(product.code)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left ${
                    productCode === product.code
                      ? "border-gold bg-gold/10"
                      : "hover:bg-accent"
                  }`}
                >
                  <span>
                    <span className="block font-semibold">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.duration_hours} jam
                    </span>
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {formatIDR(product.price_idr)}
                  </span>
                </button>
              ))}
              {products.length === 0 && !error && (
                <p className="text-sm text-muted-foreground">Memuat paket…</p>
              )}
            </div>
            <p className="rounded-lg bg-gold/10 p-3 text-xs text-muted-foreground">
              Mode MVP: gateway pembayaran belum tersambung. Aktivasi ini
              dicatat sebagai transaksi uji dan tidak menarik dana.
            </p>
            <Button
              disabled={pending || !productCode}
              onClick={() => void run("boost", productCode)}
            >
              {pending ? "Mengaktifkan…" : "Aktifkan boost uji"}
            </Button>
          </DialogContent>
        </Dialog>
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        className="h-8 rounded-full text-bu-red-deep"
        onClick={() => void run("delete")}
      >
        Hapus
      </Button>
      {error && (
        <span title={error} className="max-w-48 text-xs text-bu-red-deep">
          {error}
        </span>
      )}
    </div>
  );
}
