-- Core: profiles (publik-safe), user_contacts (privat), user_locations (privat),
-- categories, admin_users, admin_actions, app_config. RLS per PRD §45.

-- Admin identity + check function DULU — dipakai policy di bawah.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke execute on function public.is_admin() from anon;

create policy "admin_users_select_admin" on public.admin_users for select using (public.is_admin());
-- Insert/delete admin hanya via service role / SQL editor (tidak diekspos ke client).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Pengguna Baru' check (char_length(btrim(name)) between 2 and 60),
  avatar_key text,
  mode text not null default 'buyer' check (mode in ('buyer','seller')),
  status text not null default 'active' check (status in ('active','suspended','banned')),
  status_note text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is
  'Data profil PUBLIK (PRD §23). Email tetap di auth.users; phone di user_contacts — keduanya tidak pernah terekspos lewat tabel ini.';

alter table public.profiles enable row level security;

create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- Guard: kolom sensitif hanya boleh berubah oleh admin.
create or replace function public.guard_profile_sensitive()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (new.status, new.status_note, new.verified) is distinct from (old.status, old.status_note, old.verified)
     and not public.is_admin() then
    raise exception 'status/verified hanya bisa diubah oleh admin';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_sensitive
  before update on public.profiles
  for each row execute function public.guard_profile_sensitive();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Kontak privat: owner-only (PRD §45 — data sensitif hanya pemilik).
create table public.user_contacts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text check (phone ~ '^08[0-9]{8,11}$'),
  updated_at timestamptz not null default now()
);

alter table public.user_contacts enable row level security;
create policy "contacts_owner_all"
  on public.user_contacts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Lokasi user: presisi, owner-only. Publik hanya lihat area_label + jarak (PRD §13/§31).
create table public.user_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  geom geography(point, 4326) not null,
  area_label text not null check (char_length(area_label) between 1 and 80),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_locations enable row level security;
create policy "locations_owner_all"
  on public.user_locations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Satu lokasi aktif per user; set aktif → lain otomatis non-aktif.
create or replace function public.enforce_single_active_location()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.active then
    update public.user_locations
    set active = false
    where user_id = new.user_id and id <> new.id and active;
  end if;
  return new;
end;
$$;

create trigger locations_single_active
  after insert or update of active on public.user_locations
  for each row execute function public.enforce_single_active_location();

create trigger locations_set_updated_at
  before update on public.user_locations
  for each row execute function public.set_updated_at();

create index locations_user_idx on public.user_locations(user_id);
create index locations_geom_idx on public.user_locations using gist(geom);

-- Kategori configurable via admin (PRD §11).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 2 and 60),
  icon text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
create policy "categories_select_all" on public.categories for select using (true);
create policy "categories_admin_write" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

insert into public.categories (slug, name, sort_order) values
  ('hp-tablet', 'HP & Tablet', 1),
  ('laptop-komputer', 'Laptop & Komputer', 2),
  ('elektronik', 'Elektronik', 3),
  ('gaming', 'Gaming', 4),
  ('kamera', 'Kamera', 5),
  ('fashion', 'Fashion', 6),
  ('sepatu', 'Sepatu', 7),
  ('kendaraan', 'Kendaraan', 8),
  ('furniture', 'Furniture', 9),
  ('rumah', 'Rumah', 10),
  ('hobi', 'Hobi', 11),
  ('lainnya', 'Lainnya', 12);

-- Admin lama sudah dibuat di atas file; is_admin() juga.

-- app_config: konfigurasi runtime (throttle GPS, retensi, dll) — dibaca server/fungsi DB.

-- Audit trail semua aksi admin (wajib, prompt bagian J).
create table public.admin_actions (
  id bigint generated always as identity primary key,
  admin_id uuid not null references public.admin_users(user_id) on delete cascade,
  action text not null check (char_length(action) between 3 and 60),
  target_type text not null check (target_type in ('user','listing','category','report','boost_product','conversation','message')),
  target_id text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_actions enable row level security;
create policy "admin_actions_select_admin" on public.admin_actions for select using (public.is_admin());
create policy "admin_actions_insert_admin" on public.admin_actions for insert
  with check (admin_id = auth.uid() and public.is_admin());

-- Konfigurasi runtime (throttle GPS, retensi, dll) — dibaca server/fungsi DB.
create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;
create policy "app_config_select_authenticated" on public.app_config for select to authenticated using (true);
create policy "app_config_admin_write" on public.app_config for all
  using (public.is_admin()) with check (public.is_admin());

insert into public.app_config (key, value) values
  ('gps', '{"interval_ms": 30000, "min_distance_m": 50}'),
  ('location_retention', '{"ended_session_hours": 24, "max_points_per_active_session": 50}'),
  ('uploads', '{"max_image_bytes": 5242880, "allowed_mimes": ["image/jpeg","image/png","image/webp"], "max_images_per_listing": 10}');
