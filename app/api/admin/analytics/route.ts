import { handleError, ok } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET /api/admin/analytics — agregat dashboard admin (PRD §43). */
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const db = createAdminClient();

    async function count(table: string, filters?: Record<string, string>) {
      let q = db.from(table).select("id", { count: "exact", head: true });
      for (const [k, v] of Object.entries(filters ?? {})) q = q.eq(k, v);
      const { count } = await q;
      return count ?? 0;
    }

    const [
      users_total,
      users_suspended,
      users_banned,
      listings_total,
      listings_active,
      bu_listings_active,
      transactions_completed,
      cod_sessions_active,
      reports_open,
    ] = await Promise.all([
      count("profiles"),
      count("profiles", { status: "suspended" }),
      count("profiles", { status: "banned" }),
      count("listings"),
      count("listings", { status: "active" }),
      count("listings", { sale_type: "BU", status: "active" }),
      count("transactions", { status: "completed" }),
      count("cod_sessions", { state: "scheduled" }),
      count("reports", { status: "open" }),
    ]);

    return ok({
      users: {
        total: users_total,
        suspended: users_suspended,
        banned: users_banned,
      },
      listings: {
        total: listings_total,
        active: listings_active,
        bu_active: bu_listings_active,
      },
      transactions: { completed: transactions_completed },
      cod_sessions_scheduled: cod_sessions_active,
      reports_open,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    return handleError(e);
  }
}
