import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminListingActions } from "@/components/admin/admin-actions";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/format";
import { requireAdminPage } from "@/lib/server/admin-page";
export const metadata: Metadata = { title: "Admin · Listings" };
export default async function Page() {
  const { admin } = await requireAdminPage();
  const [rowsResult, reportsResult] = await Promise.all([
    admin
      .from("listings")
      .select(
        "id,seller_id,title,normal_price,bu_price,sale_type,status,area_label,views,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300),
    admin
      .from("reports")
      .select("target_id")
      .eq("target_type", "listing")
      .in("status", ["open", "reviewing"]),
  ]);
  if (rowsResult.error) throw rowsResult.error;
  if (reportsResult.error) throw reportsResult.error;
  const rows = rowsResult.data;
  const reports = reportsResult.data;
  const sellers = new Map<string, string>();
  const ids = [...new Set((rows ?? []).map((item) => item.seller_id))];
  if (ids.length) {
    const { data, error } = await admin
      .from("profiles")
      .select("id,name")
      .in("id", ids);
    if (error) throw error;
    for (const item of data ?? []) sellers.set(item.id, item.name);
  }
  const flagged = new Set((reports ?? []).map((item) => item.target_id));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Listings</h1>
        <p className="font-mono text-xs text-muted-foreground">
          Moderasi listing nyata
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground uppercase">
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(rows ?? []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/listing/${item.id}`}
                    className="font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {item.area_label}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {sellers.get(item.seller_id) ?? "Pengguna"}
                </td>
                <td className="px-4 py-3 font-mono">
                  {formatIDR(
                    item.sale_type === "BU" && item.bu_price != null
                      ? item.bu_price
                      : item.normal_price,
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Badge
                      variant="secondary"
                      className="rounded-full capitalize"
                    >
                      {item.status}
                    </Badge>
                    {flagged.has(item.id) && (
                      <Badge
                        variant="secondary"
                        className="rounded-full text-bu-red-deep"
                      >
                        <AlertTriangle className="size-3" /> Dilaporkan
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminListingActions id={item.id} status={item.status} />
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Belum ada listing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
