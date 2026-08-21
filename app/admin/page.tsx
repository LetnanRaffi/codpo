import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Flame,
  Package,
  Tag,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { ADMIN_LISTINGS, ADMIN_REPORTS, ADMIN_USERS } from "@/lib/mock/admin";

export const metadata: Metadata = { title: "Admin" };

const SECTIONS = [
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    desc: "Suspend, ban, restore",
  },
  {
    href: "/admin/listings",
    label: "Listings",
    icon: Package,
    desc: "Moderasi listing",
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: Tag,
    desc: "Kelola kategori",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: AlertTriangle,
    desc: "Tindak laporan",
  },
  {
    href: "/admin/boost",
    label: "Boost",
    icon: Flame,
    desc: "Harga & produk boost",
  },
];

export default function AdminOverviewPage() {
  const openReports = ADMIN_REPORTS.filter(
    (r) => r.status !== "resolved",
  ).length;
  const bannedUsers = ADMIN_USERS.filter((u) => u.status !== "active").length;
  const reportedListings = ADMIN_LISTINGS.filter((l) => l.reported).length;

  const stats = [
    { label: "Total users", value: "1.284", icon: Users },
    { label: "Listing aktif", value: "356", icon: Package },
    { label: "Listing BU", value: "97", icon: Flame },
    { label: "Laporan terbuka", value: openReports, icon: AlertTriangle },
    { label: "User kena sanksi", value: bannedUsers, icon: Ban },
    { label: "Listing dilaporkan", value: reportedListings, icon: Package },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">
          Admin Console
        </h1>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          Angka agregat demo — backend menyusul
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <Icon className="size-4 text-muted-foreground" aria-hidden />
            <p className="mt-2 font-display text-2xl leading-none font-bold tabular-nums">
              {typeof value === "number"
                ? value.toLocaleString("id-ID")
                : value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold tracking-wide uppercase">
          Kelola
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SECTIONS.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-2 p-4">
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-bu-red">
                    Buka
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
