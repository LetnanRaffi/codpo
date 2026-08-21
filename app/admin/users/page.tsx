import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ADMIN_USERS } from "@/lib/mock/admin";

export const metadata: Metadata = { title: "Admin · Users" };

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge
          variant="secondary"
          className="rounded-full bg-trust-green/15 text-trust-green"
        >
          Aktif
        </Badge>
      );
    case "suspended":
      return (
        <Badge
          variant="secondary"
          className="rounded-full bg-gold/20 text-foreground"
        >
          Suspend
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className="rounded-full bg-bu-red/15 text-bu-red-deep"
        >
          Banned
        </Badge>
      );
  }
}

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
          Users
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Kelola akses user — data demo
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Gabung</th>
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ADMIN_USERS.map((u) => (
              <tr key={u.id} className="hover:bg-accent/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums">
                  {u.joined}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {u.listings}
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">
                  {u.rating?.toLocaleString("id-ID") ?? "—"}
                </td>
                <td className="px-4 py-3">{statusBadge(u.status)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {u.status === "active" ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full"
                        asChild
                      >
                        <Link href="#">Suspend</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full text-bu-red-deep hover:text-bu-red"
                        asChild
                      >
                        <Link href="#">Ban</Link>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full text-trust-green hover:text-trust-green"
                      asChild
                    >
                      <Link href="#">Restore</Link>
                    </Button>
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
