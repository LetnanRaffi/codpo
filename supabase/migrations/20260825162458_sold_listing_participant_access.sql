-- Buyer/seller tetap perlu melihat detail barang setelah listing menjadi sold,
-- misalnya dari riwayat transaksi, review, sengketa, dan bukti chat.
drop policy if exists "listings_select_public_or_owner" on public.listings;
create policy "listings_select_public_owner_or_transaction_party"
  on public.listings for select
  to anon, authenticated
  using (
    status = 'active'
    or seller_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1
      from public.transactions t
      where t.listing_id = listings.id
        and (
          t.buyer_id = (select auth.uid())
          or t.seller_id = (select auth.uid())
        )
    )
  );

drop policy if exists "images_select_when_listing_visible"
  on public.listing_images;
create policy "images_select_when_listing_visible"
  on public.listing_images for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_images.listing_id
    )
  );

-- FK listing_id dan predicate policy di atas perlu index dari sisi transaksi.
create index if not exists trx_listing_parties_idx
  on public.transactions(listing_id, buyer_id, seller_id);
