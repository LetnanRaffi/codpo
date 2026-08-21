import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ADMIN_REPORTS } from "@/lib/mock/admin";

export const metadata: Metadata = { title: "Admin · Reports" };

function statusBadge(status: string) {
  switch (status) {
    case "open":
      return (
        <Badge
          variant="secondary"
          className="rounded-full bg-bu-red/15 text-bu-red-deep"
        >
          Baru
        </Badge>
      );
    case "reviewing":
      return (
        <Badge
          variant="secondary"
          className="rounded-full bg-gold/20 text-foreground"
        >
          Ditinjau
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className="rounded-full bg-trust-green/15 text-trust-green"
        >
          Selesai
        </Badge>
      );
  }
}

const REASON_LABEL: Record<string, string> = {
  scam: "Scam",
  "fake item": "Barang palsu",
  "misleading listing": "Listing menyesatkan",
};

export default function AdminReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
          Reports
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Laporan user — data demo
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Alasan</th>
              <th className="px-4 py-3 font-medium">Pelapor</th>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ADMIN_REPORTS.map((r) => (
              <tr key={r.id} className="hover:bg-accent/50">
                <td className="px-4 py-3">
                  <p className="text-xs text-muted-foreground uppercase">
                    {r.target}
                  </p>
                  <p className="line-clamp-1 max-w-64 font-medium">
                    {r.target_ref}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {REASON_LABEL[r.reason] ?? r.reason}
                </td>
                <td className="px-4 py-3">{r.reporter}</td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums">
                  {r.date}
                </td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {r.status !== "resolved" ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full text-trust-green hover:text-trust-green"
                        asChild
                      >
                        <Link href="#">Resolve</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full text-bu-red-deep hover:text-bu-red"
                        asChild
                      >
                        <Link href="#">Hapus konten</Link>
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
