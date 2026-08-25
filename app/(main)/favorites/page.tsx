import { Heart } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ListingGrid } from "@/components/listing/listing-card";
import { getListing } from "@/lib/server/marketplace";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Favorit" };

export default async function FavoritesPage() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login?next=/favorites");
  const { data } = await db
    .from("favorites")
    .select("listing_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const favorites = (
    await Promise.all((data ?? []).map((row) => getListing(row.listing_id)))
  ).filter((item) => item !== null);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">
          Favorit
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          {favorites.length} barang tersimpan
        </p>
      </div>
      {favorites.length ? (
        <ListingGrid listings={favorites} />
      ) : (
        <EmptyState
          icon={<Heart className="size-8" />}
          title="Belum ada barang favorit"
          description="Simpan barang dari halaman detail agar mudah ditemukan lagi."
          actionLabel="Cari barang sekitar"
          actionHref="/search"
        />
      )}
    </div>
  );
}
