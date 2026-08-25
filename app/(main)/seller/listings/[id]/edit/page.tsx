import { notFound, redirect } from "next/navigation";
import { ListingEditForm } from "@/components/listing/listing-edit-form";
import { createClient } from "@/lib/supabase/server";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect(`/login?next=/seller/listings/${id}/edit`);
  const { data } = await db
    .from("listings")
    .select(
      "id,title,description,normal_price,bu_price,bu_expires_at,sale_type,cod_available,area_label,status",
    )
    .eq("id", id)
    .eq("seller_id", user.id)
    .maybeSingle();
  if (!data) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase">
          Edit Listing
        </h1>
        <p className="text-sm text-muted-foreground">
          Perubahan langsung tersimpan ke marketplace.
        </p>
      </div>
      <ListingEditForm listing={data} />
    </div>
  );
}
