-- Listings + images (PRD §14-18). RLS: publik baca aktif saja; owner full kontrol miliknya.
-- Lokasi presisi tidak pernah terekspos publik — view listing_public membulatkan koordinat.

create type public.sale_type as enum ('NORMAL','BU');
create type public.listing_condition as enum ('baru','seperti_baru','baik','layak_pakai');
create type public.listing_status as enum ('active','inactive','sold','removed');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  title text not null check (char_length(btrim(title)) between 5 and 140),
  description text not null default '' check (char_length(description) <= 5000),
  condition public.listing_condition not null,
  normal_price bigint not null check (normal_price >= 0 and normal_price <= 100000000000),
  bu_price bigint check (bu_price >= 0),
  bu_expires_at timestamptz,
  sale_type public.sale_type not null default 'NORMAL',
  status public.listing_status not null default 'active',
  cod_available boolean not null default false,
  area_label text not null check (char_length(area_label) between 1 and 80),
  geom geography(point, 4326) not null,
  views integer not null default 0 check (views >= 0),
  boosted_until timestamptz,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- BU wajib punya harga BU (PRD §16)
  constraint bu_requires_price check (
    sale_type = 'NORMAL' or (sale_type = 'BU' and bu_price is not null and bu_expires_at is not null)
  ),
  -- BU price harus lebih murah dari normal (semangat PRD §15: harga menarik)
  constraint bu_cheaper check (bu_price is null or bu_price < normal_price)
);

alter table public.listings enable row level security;

create policy "listings_select_public_or_owner"
  on public.listings for select
  using (status = 'active' or seller_id = auth.uid() or public.is_admin());

create policy "listings_insert_own"
  on public.listings for insert
  with check (
    seller_id = auth.uid()
    and status = 'active'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active')
  );

create policy "listings_update_own"
  on public.listings for update
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "listings_delete_own"
  on public.listings for delete
  using (seller_id = auth.uid());

-- Owner tidak boleh: ubah views, set status removed (khusus admin), atau jadi seller lain.
create or replace function public.guard_listing_owner_update()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.seller_id <> old.seller_id then
    raise exception 'seller_id tidak bisa diubah';
  end if;
  if new.views <> old.views then
    raise exception 'views hanya bertambah via sistem';
  end if;
  if new.status = 'removed' and auth.uid() is not null and not public.is_admin() then
    raise exception 'status removed hanya lewat moderasi admin';
  end if;
  return new;
end;
$$;

create trigger listings_guard_owner_update
  before update on public.listings
  for each row execute function public.guard_listing_owner_update();

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- Hapus listing diblokir kalau masih ada COD/transaksi yang belum selesai.
create or replace function public.guard_listing_delete()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.transactions t
    where (t.listing_id = old.id) and t.status not in ('completed','cancelled')
  ) then
    raise exception 'listing masih punya transaksi berjalan — nonaktifkan saja';
  end if;
  return old;
end;
$$;

create trigger listings_guard_delete
  before delete on public.listings
  for each row execute function public.guard_listing_delete();

create index listings_status_created_idx on public.listings(status, created_at desc);
create index listings_seller_idx on public.listings(seller_id);
create index listings_category_idx on public.listings(category_id);
create index listings_geom_idx on public.listings using gist(geom);
create index listings_title_trgm_idx on public.listings using gin (title public.gin_trgm_ops);

-- View publik: koordinat dibulatkan ~110m (PRD §13 — gak ada alamat presisi di publik).
create view public.listing_public
with (security_invoker = true) as
select
  l.id, l.seller_id, l.category_id, c.slug as category_slug, c.name as category_name,
  l.title, l.description, l.condition, l.normal_price, l.bu_price, l.bu_expires_at,
  case when l.sale_type = 'BU' and l.bu_expires_at > now() then 'BU'::public.sale_type else 'NORMAL'::public.sale_type end as effective_sale_type,
  l.status, l.cod_available, l.area_label,
  st_y(st_snaptogrid(l.geom::geometry, 0.001)) as approx_lat,
  st_x(st_snaptogrid(l.geom::geometry, 0.001)) as approx_lng,
  l.boosted_until, l.views, l.created_at, l.updated_at
from public.listings l
join public.categories c on c.id = l.category_id
where l.status = 'active';

grant select on public.listing_public to anon, authenticated;

-- Images: metadata saja, binary di R2 (PRD §17/§47).
create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  object_key text not null unique check (object_key ~ '^listings/[a-f0-9-]{36}/[a-zA-Z0-9._-]{8,120}$'),
  position smallint not null default 0 check (position between 0 and 19),
  created_at timestamptz not null default now()
);

alter table public.listing_images enable row level security;

create policy "images_select_when_listing_visible"
  on public.listing_images for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and (l.status = 'active' or l.seller_id = auth.uid())
    )
  );

create policy "images_write_owner"
  on public.listing_images for insert
  with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
  );

create policy "images_delete_owner"
  on public.listing_images for delete
  using (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid())
  );

-- Maks gambar per listing dari app_config.
create or replace function public.guard_image_count()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare v_max int;
begin
  select coalesce((value->>'max_images_per_listing')::int, 10)
    into v_max from public.app_config where key = 'uploads';
  if (select count(*) from public.listing_images where listing_id = new.listing_id) >= v_max then
    raise exception 'maksimal % gambar per listing', v_max;
  end if;
  return new;
end;
$$;

create trigger images_guard_count
  before insert on public.listing_images
  for each row execute function public.guard_image_count();

create index images_listing_idx on public.listing_images(listing_id, position);
