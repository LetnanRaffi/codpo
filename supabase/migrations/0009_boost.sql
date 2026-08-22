-- Boost Listing (PRD §39) — monetisasi MVP. Payment gateway: BELUM diputuskan
-- (kandidat Midtrans/Xendit) → pembayaran dicatat sebagai status 'paid' simulasi;
-- rows tetap tersimpan untuk audit & swap gateway nanti (prompt bagian K).

create table public.boost_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]{3,30}$'),
  name text not null,
  duration_hours int not null check (duration_hours between 1 and 720),
  price_idr bigint not null check (price_idr >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.boost_products enable row level security;

create policy "boost_products_select"
  on public.boost_products for select using (active or public.is_admin());

create policy "boost_products_admin_write"
  on public.boost_products for all
  using (public.is_admin()) with check (public.is_admin());

create trigger boost_products_set_updated_at
  before update on public.boost_products
  for each row execute function public.set_updated_at();

insert into public.boost_products (code, name, duration_hours, price_idr) values
  ('boost_24h', 'Boost 24 Jam', 24, 4000),
  ('boost_3d', 'Boost 3 Hari', 72, 8000),
  ('super_boost', 'Super Boost', 168, 15000);

create type public.boost_status as enum ('pending','paid','cancelled','expired');

create table public.listing_boosts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  product_id uuid not null references public.boost_products(id),
  seller_id uuid not null references public.profiles(id),
  status public.boost_status not null default 'pending',
  amount_paid_idr bigint not null default 0 check (amount_paid_idr >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.listing_boosts enable row level security;

create policy "boosts_select_own_or_admin"
  on public.listing_boosts for select
  using (seller_id = auth.uid() or public.is_admin());

-- Insert hanya lewat RPC purchase_boost (validasi ownership + snapshot harga).
create index boosts_listing_idx on public.listing_boosts(listing_id);
create index boosts_seller_idx on public.listing_boosts(seller_id, created_at desc);

-- Beli boost: ownership dicek, harga di-snapshot dari produk, listing.boosted_until diperpanjang.
-- Boost CUMA pengaruh ranking (§39) — harga listing tidak disentuh.
create or replace function public.purchase_boost(p_listing_id uuid, p_product_code text)
returns uuid
language plpgsql
security invoker set search_path = ''
as $$
declare v_product public.boost_products; v_id uuid; v_start timestamptz; v_end timestamptz;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;

  if not exists (
    select 1 from public.listings l
    where l.id = p_listing_id and l.seller_id = auth.uid()
      and l.status in ('active','inactive')
  ) then
    raise exception 'listing tidak ditemukan / bukan milikmu';
  end if;

  select * into v_product from public.boost_products
   where code = p_product_code and active;
  if v_product.id is null then raise exception 'produk boost tidak tersedia'; end if;

  -- Simulasi pembayaran sukses (record-only). Gateway asli nanti: buat row pending
  -- → webhook konfirmasi → set paid. Struktur tabel sudah mendukung.
  v_start := greatest(now(), coalesce(
    (select max(ends_at) from public.listing_boosts
      where listing_id = p_listing_id and status = 'paid' and ends_at > now()),
    now()
  ));
  v_end := v_start + make_interval(hours => v_product.duration_hours);

  insert into public.listing_boosts
    (listing_id, product_id, seller_id, status, amount_paid_idr, starts_at, ends_at)
  values
    (p_listing_id, v_product.id, auth.uid(), 'paid', v_product.price_idr, v_start, v_end)
  returning id into v_id;

  update public.listings
     set boosted_until = v_end
   where id = p_listing_id;

  perform public.notify(auth.uid(), 'boost_activated', 'Boost aktif 🚀',
    format('%s aktif sampai %s', v_product.name, to_char(v_end, 'DD Mon HH24:MI')),
    jsonb_build_object('listing_id', p_listing_id));

  return v_id;
end;
$$;
