import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";
import { ADMIN_LISTINGS } from "@/lib/mock/admin";

export const metadata: Metadata = { title: "Admin · Listings" };

export default function AdminListingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
          Listings
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Moderasi listing — data demo
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Seller</th>
              <th className="px-4 py-3 font-medium">Harga</th>
              <th className="px-4 py-3 font-medium">Dilihat</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ADMIN_LISTINGS.map((l) => (
              <tr key={l.id} className="hover:bg-accent/50">
                <td className="max-w-72 px-4 py-3">
                  <Link
                    href={`/listing/${l.id}`}
                    className="line-clamp-1 font-medium hover:underline"
                  >
                    {l.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {l.area_label}
                  </p>
                </td>
                <td className="px-4 py-3">{l.seller}</td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {formatIDR(l.price)}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{l.views}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant="secondary"
                      className="rounded-full capitalize"
                    >
                      {l.status === "active"
                        ? "Aktif"
                        : l.status === "sold"
                          ? "Terjual"
                          : "Nonaktif"}
                    </Badge>
                    {l.sale_type === "BU" && (
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-bu-red/15 text-bu-red-deep"
                      >
                        🔥 BU
                      </Badge>
                    )}
                    {l.reported && (
                      <Badge
                        variant="secondary"
                        className="gap-1 rounded-full text-bu-red-deep"
                      >
                        <AlertTriangle className="size-3" aria-hidden />{" "}
                        Dilaporkan
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full"
                    asChild
                  >
                    <Link href="#">Review</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full text-bu-red-deep hover:text-bu-red"
                    asChild
                  >
                    <Link href="#">Hapus</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
