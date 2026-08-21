import type { Metadata } from "next";

import { SellForm } from "@/app/(main)/sell/sell-form";

export const metadata: Metadata = { title: "Jual Barang" };

export default function SellPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">
        Jual Barang
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Barang laku cepat kalau harga jujur + foto jelas. Tandai BU biar makin
        keliatan.
      </p>
      <SellForm />
    </div>
  );
}
