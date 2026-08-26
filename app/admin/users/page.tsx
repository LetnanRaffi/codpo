import type { Metadata } from "next";
import { AdminUserActions } from "@/components/admin/admin-actions";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/lib/server/admin-page";
export const metadata: Metadata = { title: "Admin · Users" };
export default async function Page() {
  const { admin } = await requireAdminPage();
  const [usersResult, repsResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id,name,status,created_at")
      .order("created_at", { ascending: false })
      .limit(300),
    admin
      .from("user_reputation")
      .select("user_id,avg_rating,completed_transactions"),
  ]);
  if (usersResult.error) throw usersResult.error;
  if (repsResult.error) throw repsResult.error;
  const users = usersResult.data;
  const reps = repsResult.data;
  const rep = new Map((reps ?? []).map((item) => [item.user_id, item]));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase">Users</h1>
        <p className="font-mono text-xs text-muted-foreground">
          Kelola akses user nyata
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground uppercase">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Gabung</th>
              <th className="px-4 py-3">Transaksi</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(users ?? []).map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {new Date(user.created_at).toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-3">
                  {rep.get(user.id)?.completed_transactions ?? 0}
                </td>
                <td className="px-4 py-3">
                  {Number(rep.get(user.id)?.avg_rating ?? 0).toLocaleString(
                    "id-ID",
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className="rounded-full capitalize"
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminUserActions id={user.id} status={user.status} />
                </td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Belum ada user.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
