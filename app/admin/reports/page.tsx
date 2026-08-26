import type { Metadata } from "next";
import Link from "next/link";
import { AdminReportActions } from "@/components/admin/admin-actions";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/lib/server/admin-page";
export const metadata: Metadata = { title: "Admin · Reports" };
export default async function Page() {
  const { admin } = await requireAdminPage();
  const { data: reports, error: reportsError } = await admin
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (reportsError) throw reportsError;
  const reporterIds = [
    ...new Set((reports ?? []).map((item) => item.reporter_id)),
  ];
  const names = new Map<string, string>();
  if (reporterIds.length) {
    const { data, error } = await admin
      .from("profiles")
      .select("id,name")
      .in("id", reporterIds);
    if (error) throw error;
    for (const item of data ?? []) names.set(item.id, item.name);
  }
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Reports</h1>
        <p className="font-mono text-xs text-muted-foreground">
          Antrean laporan user
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground uppercase">
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Alasan</th>
              <th className="px-4 py-3">Pelapor</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(reports ?? []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="text-xs text-muted-foreground uppercase">
                    {item.target_type}
                  </p>
                  {item.target_type === "listing" ? (
                    <Link
                      href={`/listing/${item.target_id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {item.target_id}
                    </Link>
                  ) : item.target_type === "user" ? (
                    <Link
                      href={`/seller/${item.target_id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {item.target_id}
                    </Link>
                  ) : (
                    <p className="font-mono text-xs">{item.target_id}</p>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">
                  {item.reason.replaceAll("_", " ")}
                  {item.description && (
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground normal-case">
                      {item.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {names.get(item.reporter_id) ?? "Pengguna"}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {new Date(item.created_at).toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className="rounded-full capitalize"
                  >
                    {item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminReportActions id={item.id} status={item.status} />
                </td>
              </tr>
            ))}
            {(reports ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Tidak ada laporan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
