"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { apiFetch } from "@/lib/client/api";

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
  async function run(action: "boost" | "delete") {
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
          body: JSON.stringify({ product_code: "boost_24h" }),
        });
      else await apiFetch(`/api/listings/${id}`, { method: "DELETE" });
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
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          className="h-8 rounded-full text-gold"
          onClick={() => void run("boost")}
        >
          🚀 Boost
        </Button>
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
        <span title={error} className="text-xs text-bu-red-deep">
          Gagal
        </span>
      )}
    </div>
  );
}
