"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
      <AlertTriangle className="size-8 text-bu-red" aria-hidden />
      <p className="font-semibold">Gagal memuat barang</p>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        Koneksi lagi bermasalah. Cek internetmu, lalu coba muat ulang.
      </p>
      <Button size="sm" className="mt-1 rounded-full" onClick={reset}>
        Coba lagi
      </Button>
    </div>
  );
}
