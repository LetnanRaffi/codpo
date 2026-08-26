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
import { requireAdminPage } from "@/lib/server/admin-page";

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
export default async function AdminPage() {
  const { admin } = await requireAdminPage();
  const count = async (table: string, filters: Record<string, string> = {}) => {
    let query = admin.from(table).select("id", { count: "exact", head: true });
    for (const [key, value] of Object.entries(filters))
      query = query.eq(key, value);
    const { count: total, error } = await query;
    if (error) throw error;
    return total ?? 0;
  };
  const [users, active, bu, reports, suspended, reported] = await Promise.all([
    count("profiles"),
    count("listings", { status: "active" }),
    count("listings", { status: "active", sale_type: "BU" }),
    count("reports", { status: "open" }),
    count("profiles", { status: "suspended" }),
    count("reports"),
  ]);
  const stats = [
    { label: "Total users", value: users, icon: Users },
    { label: "Listing aktif", value: active, icon: Package },
    { label: "Listing BU", value: bu, icon: Flame },
    { label: "Laporan terbuka", value: reports, icon: AlertTriangle },
    { label: "User kena sanksi", value: suspended, icon: Ban },
    { label: "Total laporan", value: reported, icon: Package },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase md:text-4xl">
          Admin Console
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Data produksi saat ini
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <Icon className="size-4 text-muted-foreground" />
            <p className="mt-2 font-display text-2xl font-bold">
              {value.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold uppercase">Kelola</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SECTIONS.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href}>
              <Card className="h-full hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-2 p-4">
                  <Icon className="size-5 text-muted-foreground" />
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs text-bu-red">
                    Buka <ArrowRight className="size-3.5" />
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
