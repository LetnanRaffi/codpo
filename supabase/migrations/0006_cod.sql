-- COD request/session/state machine/live tracking (PRD §27-31) + Transactions (§35).
-- Transisi state divalidasi server-side di DB — tidak bisa loncat state.

create type public.cod_request_status as enum ('requested','accepted','rejected','countered','cancelled');
create type public.cod_state as enum (
  'accepted','scheduled','otw','near_location','arrived',
  'item_check','completed','cancelled','no_show','disputed','expired'
);
create type public.trx_status as enum (
  'pending','in_progress','item_check','completed','cancelled','no_show','disputed'
);

-- ============ COD REQUESTS (PRD §27) ============
create table public.cod_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  preferred_date date not null,
  preferred_time time not null,
  meeting_point text not null check (char_length(meeting_point) between 3 and 200),
  note text check (char_length(note) <= 500),

  -- usulan alternatif dari seller (PRD §27: suggest different time/location)
  counter_date date,
  counter_time time,
  counter_meeting_point text,

  status public.cod_request_status not null default 'requested',
  responded_at timestamptz,
  created_at timestamptz not null default now(),

  constraint req_parties check (buyer_id <> seller_id),
  constraint counter_complete check (
    status <> 'countered' or (counter_date is not null and counter_time is not null and counter_meeting_point is not null)
  )
);

alter table public.cod_requests enable row level security;

create policy "codreq_select_party"
  on public.cod_requests for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "codreq_insert_buyer"
  on public.cod_requests for insert
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = seller_id and l.status = 'active' and l.cod_available
    )
    and exists (select 1 from public.profiles p where p.id = buyer_id and p.status = 'active')
  );

-- Seller merespons (accept/reject/counter) selama masih requested.
create policy "codreq_update_seller"
  on public.cod_requests for update
  using (seller_id = auth.uid() and status = 'requested')
  with check (seller_id = auth.uid());

-- Buyer batal sendiri selama belum direspons.
create policy "codreq_delete_buyer_pending"
  on public.cod_requests for delete
  using (buyer_id = auth.uid() and status = 'requested');

create index codreq_seller_status_idx on public.cod_requests(seller_id, status);
create index codreq_buyer_idx on public.cod_requests(buyer_id);

-- ============ COD SESSIONS (PRD §28-29) ============
create table public.cod_sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.cod_requests(id),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  state public.cod_state not null default 'accepted',

  meeting_point text not null,
  meeting_geom geography(point, 4326),
  scheduled_at timestamptz not null,

  sharing_enabled boolean not null default false,   -- opt-in GPS eksplisit (PRD §31)
  last_state_actor uuid references public.profiles(id),
  last_location_at timestamptz,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.cod_sessions enable row level security;

create policy "codsession_select_party"
  on public.cod_sessions for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Kolom state/meeting hanya lewat RPC cod_transition (validasi transisi).
create policy "codsession_update_limited"
  on public.cod_sessions for update
  using (buyer_id = auth.uid() or seller_id = auth.uid())
  with check (buyer_id = auth.uid() or seller_id = auth.uid());

create index codsession_party_idx on public.cod_sessions(buyer_id, seller_id);
create index codsession_state_idx on public.cod_sessions(state);

-- State machine (PRD §29). Peta transisi eksplisit — sisanya ditolak.
create or replace function public.cod_transition_allowed(p_from public.cod_state, p_to public.cod_state)
returns boolean
language sql
immutable
as $$
  select (p_from, p_to) in (values
    ('accepted'::public.cod_state,      'scheduled'::public.cod_state),
    ('accepted',                        'cancelled'),
    ('accepted',                        'no_show'),
    ('scheduled',                       'otw'),
    ('scheduled',                       'arrived'),
    ('scheduled',                       'cancelled'),
    ('scheduled',                       'no_show'),
    ('otw',                             'near_location'),
    ('otw',                             'arrived'),
    ('otw',                             'cancelled'),
    ('otw',                             'no_show'),
    ('near_location',                   'arrived'),
    ('near_location',                   'cancelled'),
    ('near_location',                   'no_show'),
    ('arrived',                         'item_check'),
    ('arrived',                         'cancelled'),
    ('arrived',                         'disputed'),
    ('item_check',                      'completed'),
    ('item_check',                      'disputed')
  );
$$;

-- RPC transisi: dipanggil endpoint /api/cod/sessions/[id]/state.
-- Role rules: completed/item_check hanya BUYER (PRD §33); lainnya salah satu party.
create or replace function public.cod_transition(p_session_id uuid, p_target public.cod_state)
returns public.cod_state
language plpgsql
security invoker set search_path = public
as $$
declare v_row public.cod_sessions;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;

  select * into v_row from public.cod_sessions
   where id = p_session_id and (buyer_id = auth.uid() or seller_id = auth.uid())
   for update;

  if v_row.id is null then raise exception 'sesi tidak ditemukan'; end if;

  if public.cod_transition_allowed(v_row.state, p_target) is not true then
    raise exception 'transisi % → % tidak valid', v_row.state, p_target;
  end if;

  if p_target in ('item_check','completed') and auth.uid() <> v_row.buyer_id then
    raise exception 'hanya buyer yang bisa konfirmasi barang/selesaikan';
  end if;

  update public.cod_sessions s
     set state = p_target,
         last_state_actor = auth.uid(),
         ended_at = case when p_target in ('completed','cancelled','no_show','disputed') then now() else s.ended_at end,
         sharing_enabled = case when p_target in ('completed','cancelled','no_show','disputed') then false else s.sharing_enabled end
   where s.id = p_session_id;

  return p_target;
end;
$$;

-- Sync otomatis transactions + listing terjual saat state berubah.
create or replace function public.sync_transaction_on_session()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare v_trx public.trx_status;
begin
  v_trx := case new.state
    when 'accepted' then 'pending'::public.trx_status
    when 'scheduled' then 'in_progress'
    when 'otw' then 'in_progress'
    when 'near_location' then 'in_progress'
    when 'arrived' then 'in_progress'
    when 'item_check' then 'item_check'
    when 'completed' then 'completed'
    when 'cancelled' then 'cancelled'
    when 'no_show' then 'no_show'
    when 'disputed' then 'disputed'
    when 'expired' then 'cancelled'
  end;

  update public.transactions t
     set status = v_trx,
         completed_at = case when v_trx = 'completed' then now() else t.completed_at end
   where t.session_id = new.id;

  if new.state = 'completed' then
    update public.listings
       set status = 'sold', sold_at = now()
     where id = new.listing_id;
  end if;

  return new;
end;
$$;

create trigger codsessions_sync_transaction
  after update of state on public.cod_sessions
  for each row execute function public.sync_transaction_on_session();

-- ============ TRANSACTIONS (PRD §35) ============
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.cod_sessions(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  agreed_price bigint not null check (agreed_price >= 0),
  status public.trx_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.transactions enable row level security;

create policy "trx_select_party"
  on public.transactions for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Status dikendalikan trigger sync dari sesi; client tidak menulis langsung.
create index trx_buyer_idx on public.transactions(buyer_id, created_at desc);
create index trx_seller_idx on public.transactions(seller_id, created_at desc);

-- ============ ACCEPT FLOW (atomik: request→session+transaction, PRD §28) ============
create or replace function public.accept_cod_request(p_request_id uuid)
returns uuid
language plpgsql
security invoker set search_path = public
as $$
declare v_req public.cod_requests; v_session uuid;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;

  select * into v_req from public.cod_requests
   where id = p_request_id and seller_id = auth.uid() and status = 'requested'
   for update;

  if v_req.id is null then raise exception 'request tidak ditemukan / sudah direspons'; end if;

  update public.cod_requests
     set status = 'accepted', responded_at = now()
   where id = p_request_id;

  insert into public.cod_sessions
    (request_id, listing_id, buyer_id, seller_id, state, meeting_point, scheduled_at)
  values
    (v_req.id, v_req.listing_id, v_req.buyer_id, v_req.seller_id,
     'accepted', v_req.meeting_point, (v_req.preferred_date + v_req.preferred_time) at time zone 'UTC')
  returning id into v_session;

  insert into public.transactions
    (session_id, listing_id, buyer_id, seller_id, agreed_price)
  values
    (v_session, v_req.listing_id, v_req.buyer_id, v_req.seller_id,
     coalesce(
       (select l.bu_price from public.listings l
         where l.id = v_req.listing_id and l.sale_type = 'BU' and l.bu_expires_at > now()),
       (select l.normal_price from public.listings l where l.id = v_req.listing_id)
     ));

  return v_session;
end;
$$;

-- Reject & counter: endpoint cukup update kolom (RLS sudah batasi seller+requested).
create or replace function public.reject_cod_request(p_request_id uuid)
returns void
language plpgsql
security invoker set search_path = public
as $$
begin
  update public.cod_requests
     set status = 'rejected', responded_at = now()
   where id = p_request_id and seller_id = auth.uid() and status = 'requested';
  if not found then raise exception 'request tidak ditemukan / sudah direspons'; end if;
end;
$$;

create or replace function public.counter_cod_request(
  p_request_id uuid, p_date date, p_time time, p_point text
) returns void
language plpgsql
security invoker set search_path = public
as $$
begin
  update public.cod_requests
     set status = 'countered', responded_at = now(),
         counter_date = p_date, counter_time = p_time, counter_meeting_point = p_point
   where id = p_request_id and seller_id = auth.uid() and status = 'requested';
  if not found then raise exception 'request tidak ditemukan / sudah direspons'; end if;
end;
$$;

-- ============ LIVE TRACKING (PRD §30-31) ============
create table public.cod_locations (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.cod_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  geom geography(point, 4326) not null,
  accuracy_m int,
  recorded_at timestamptz not null default now()
);

alter table public.cod_locations enable row level security;

create policy "codloc_select_party"
  on public.cod_locations for select
  using (
    exists (
      select 1 from public.cod_sessions s
      where s.id = session_id and (s.buyer_id = auth.uid() or s.seller_id = auth.uid())
    )
  );

-- Insert TIDAK dibolehkan langsung ke client — hanya lewat RPC post_cod_location
-- (throttle server-side + opt-in + state aktif dicek di satu tempat).
create index codloc_session_time_idx on public.cod_locations(session_id, recorded_at desc);
create index codloc_geom_idx on public.cod_locations using gist(geom);

create type public.post_location_result as enum ('stored','throttled');

create or replace function public.post_cod_location(
  p_session_id uuid, p_lat double precision, p_lng double precision, p_accuracy_m int default null
) returns public.post_location_result
language plpgsql
security invoker set search_path = public
as $$
declare
  v_session public.cod_sessions;
  v_cfg jsonb;
  v_last record;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;

  select * into v_session from public.cod_sessions
   where id = p_session_id and (buyer_id = auth.uid() or seller_id = auth.uid());

  if v_session.id is null then raise exception 'sesi tidak ditemukan'; end if;

  -- Server MENOLAK update setelah sesi bukan state bergerak (PRD §31: berhenti otomatis)
  if v_session.state not in ('accepted','scheduled','otw','near_location','arrived') then
    raise exception 'tracking tidak aktif untuk sesi ini';
  end if;

  -- Opt-in eksplisit (PRD §31 rule #1)
  if not v_session.sharing_enabled then
    raise exception 'sharing lokasi belum diaktifkan user';
  end if;

  select value into v_cfg from public.app_config where key = 'gps';

  -- Throttle waktu PER-USER (default 30s — PRD §30: jangan tiap detik).
  -- clock_timestamp, bukan now(): now() = waktu transaksi → umur selalu 0.
  select geom, recorded_at,
         st_distance(geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::public.geography) as dist
    into v_last
    from public.cod_locations
   where session_id = p_session_id and user_id = auth.uid()
   order by recorded_at desc limit 1;

  if v_last.recorded_at is not null
     and extract(epoch from (clock_timestamp() - v_last.recorded_at)) * 1000
         < coalesce((v_cfg->>'interval_ms')::bigint, 30000) then
    return 'throttled';
  end if;

  -- Throttle jarak (default 50m)
  if v_last.geom is not null
     and v_last.dist < coalesce((v_cfg->>'min_distance_m')::int, 50) then
    return 'throttled';
  end if;

  insert into public.cod_locations (session_id, user_id, geom, accuracy_m, recorded_at)
  values (p_session_id, auth.uid(),
          st_setsrid(st_makepoint(p_lng, p_lat), 4326)::public.geography,
          p_accuracy_m, clock_timestamp());

  update public.cod_sessions
     set last_location_at = clock_timestamp()
   where id = p_session_id;

  return 'stored';
end;
$$;

-- Toggle opt-in GPS milik sendiri (PRD §31 rule #1: explicit enable/disable).
create or replace function public.set_location_sharing(p_session_id uuid, p_enabled boolean)
returns void
language plpgsql
security invoker set search_path = public
as $$
begin
  update public.cod_sessions
     set sharing_enabled = p_enabled
   where id = p_session_id
     and (buyer_id = auth.uid() or seller_id = auth.uid())
     and state in ('accepted','scheduled','otw','near_location','arrived');
  if not found then raise exception 'sesi tidak ditemukan / tidak lagi aktif'; end if;
end;
$$;

-- Retensi (PRD §31 rule #4): histori gak disimpan berlebihan.
-- 1) Sesi selesai >24 jam → semua titik sesi itu dihapus.
-- 2) Sesi aktif → simpan maks N titik TERBARU per user per sesi (bukan histori penuh).
create or replace function public.purge_cod_locations()
returns void
language plpgsql
security definer set search_path = public
as $$
declare v_retention jsonb;
begin
  select value into v_retention from public.app_config where key = 'location_retention';

  delete from public.cod_locations cl
  using public.cod_sessions s
  where cl.session_id = s.id
    and s.state in ('completed','cancelled','no_show','disputed','expired')
    and s.ended_at < now() - make_interval(hours => coalesce((v_retention->>'ended_session_hours')::int, 24));

  delete from public.cod_locations cl
  where cl.id in (
    select id from (
      select cl.id, row_number() over (partition by cl.session_id, cl.user_id order by cl.recorded_at desc) rn
      from public.cod_locations cl
      join public.cod_sessions s on s.id = cl.session_id
      where s.state in ('accepted','scheduled','otw','near_location','arrived')
    ) ranked
    where rn > coalesce((v_retention->>'max_points_per_active_session')::int, 50)
  );
end;
$$;

-- Purge mandiri oleh user (scoped KETAT ke dirinya — fix potensi bug hapus data user lain):
create or replace function public.purge_my_locations(p_session_id uuid)
returns int
language plpgsql
security invoker set search_path = public
as $$
declare v_deleted int;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;

  with del as (
    delete from public.cod_locations cl
    where cl.session_id = p_session_id
      and cl.user_id = auth.uid()
      and exists (
        select 1 from public.cod_sessions s
        where s.id = cl.session_id and (s.buyer_id = auth.uid() or s.seller_id = auth.uid())
      )
    returning 1
  )
  select count(*) into v_deleted from del;

  return v_deleted;
end;
$$;

-- Expire sesi zombie (accepted/scheduled tapi tidak pernah lanjut 24 jam setelah jadwal).
create or replace function public.expire_stale_cod_sessions()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.cod_sessions
     set state = 'expired', ended_at = now(), sharing_enabled = false
   where state in ('accepted','scheduled')
     and scheduled_at < now() - interval '24 hours';
end;
$$;
