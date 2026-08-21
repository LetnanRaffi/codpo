import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chat" };

export default function ChatIndexPage() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-2 p-8 text-center lg:flex">
      <MessageSquare className="size-8 text-muted-foreground/50" aria-hidden />
      <p className="font-semibold">Pilih percakapan</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Semua chat soal barang &amp; COD kamu tampil di sini.
      </p>
    </div>
  );
}
