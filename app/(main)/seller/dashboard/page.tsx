import { Eye, Flame, Handshake, Package, Rocket, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerListingActions } from "@/components/listing/seller-listing-actions";
import { SellerCodRequests } from "@/components/listing/seller-cod-requests";
import { CodSessionActions } from "@/components/listing/cod-session-actions";
import { ReviewDialog } from "@/components/listing/review-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard Seller" };

function sessionData(value: unknown): { id: string; state: string } | null {
  const session = Array.isArray(value) ? value[0] : value;
  return session &&
    typeof session === "object" &&
    "state" in session &&
    "id" in session
    ? { id: String(session.id), state: String(session.state) }
    : null;
}

export default async function SellerDashboardPage() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login?next=/seller/dashboard");
  const [
    { data: listings },
    { data: transactions },
    { count: codOpen },
    { data: reputation },
  ] = await Promise.all([
    db
      .from("listings")
      .select(
        "id,title,normal_price,bu_price,sale_type,status,views,boosted_until,created_at",
      )
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    db
      .from("transactions")
      .select(
        "id,listing_id,buyer_id,status,agreed_price,created_at,cod_sessions(id,state,scheduled_at)",
      )
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("cod_requests")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", user.id)
      .eq("status", "requested"),
    db
      .from("user_reputation")
      .select("avg_rating,completed_transactions")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  const rows = listings ?? [];
  const names = new Map<string, string>();
  const buyerIds = [
    ...new Set((transactions ?? []).map((item) => item.buyer_id)),
  ];
  if (buyerIds.length) {
    const { data } = await db
      .from("profiles")
      .select("id,name")
      .in("id", buyerIds);
    for (const profile of data ?? []) names.set(profile.id, profile.name);
  }
  const listingNames = new Map(rows.map((item) => [item.id, item.title]));
  const stats = [
    {
      label: "Listing aktif",
      value: rows.filter((item) => item.status === "active").length,
      icon: Package,
    },
    {
      label: "Terjual",
      value: rows.filter((item) => item.status === "sold").length,
      icon: Handshake,
    },
    {
      label: "Total dilihat",
      value: rows.reduce((sum, item) => sum + item.views, 0),
      icon: Eye,
    },
    { label: "COD masuk", value: codOpen ?? 0, icon: Flame },
    {
      label: "Transaksi selesai",
      value: reputation?.completed_transactions ?? 0,
      icon: Rocket,
    },
    {
      label: "Rating",
      value: Number(reputation?.avg_rating ?? 0).toLocaleString("id-ID"),
      icon: Star,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">
            Dashboard Seller
          </h1>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            Ringkasan toko dan transaksi nyata
          </p>
        </div>
        <Button className="rounded-full font-bold" asChild>
          <Link href="/sell">+ Pasang Listing</Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <Icon className="size-4 text-muted-foreground" />
            <p className="mt-2 font-display text-2xl leading-none font-bold tabular-nums">
              {typeof value === "number"
                ? value.toLocaleString("id-ID")
                : value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <SellerCodRequests />
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold tracking-wide uppercase">
          Listing Kamu
        </h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3">Barang</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Dilihat</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((item) => {
                const boosted =
                  !!item.boosted_until &&
                  new Date(item.boosted_until) > new Date();
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/listing/${item.id}`}>{item.title}</Link>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {formatIDR(
                        item.sale_type === "BU" && item.bu_price != null
                          ? item.bu_price
                          : item.normal_price,
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className="rounded-full capitalize"
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono">{item.views}</td>
                    <td className="px-4 py-3">
                      <SellerListingActions id={item.id} boosted={boosted} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold tracking-wide uppercase">
          Transaksi &amp; COD
        </h2>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                <th className="px-4 py-3">Barang</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Nilai</th>
                <th className="px-4 py-3">COD</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(transactions ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium">
                    {listingNames.get(item.listing_id) ?? "Listing"}
                  </td>
                  <td className="px-4 py-3">
                    {names.get(item.buyer_id) ?? "Pengguna"}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {formatIDR(item.agreed_price)}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {sessionData(item.cod_sessions)?.state ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    {sessionData(item.cod_sessions) && (
                      <CodSessionActions
                        sessionId={sessionData(item.cod_sessions)!.id}
                        state={sessionData(item.cod_sessions)!.state}
                        role="seller"
                      />
                    )}
                    {item.status === "completed" && (
                      <ReviewDialog transactionId={item.id} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className="rounded-full capitalize"
                    >
                      {item.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
