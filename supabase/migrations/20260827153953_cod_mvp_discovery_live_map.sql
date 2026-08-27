-- CODPO MVP: nearby-first discovery, map-based meeting points, reciprocal GPS consent.
-- Additive migration: old requests without coordinates remain usable via text fallback.

-- 1) Nearby-first discovery. radius_m is now a ranking preference, not a hard filter.
create or replace function public.search_listings(
  p_q text default null,
  p_category_slug text default null,
  p_condition public.listing_condition default null,
  p_min_price bigint default null,
  p_max_price bigint default null,
  p_bu_only boolean default false,
  p_cod_only boolean default false,
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_m int default null,
  p_sort text default 'recommended',
  p_limit int default 24,
  p_offset int default 0
)
returns table (
  id uuid,
  seller_id uuid,
  seller_name text,
  seller_rating numeric,
  category_slug text,
  title text,
  description text,
  condition public.listing_condition,
  normal_price bigint,
  bu_price bigint,
  effective_sale_type public.sale_type,
  cod_available boolean,
  area_label text,
  approx_lat double precision,
  approx_lng double precision,
  distance_km numeric,
  boosted boolean,
  created_at timestamptz,
  score jsonb
)
language sql
stable
security invoker set search_path = public
as $$
  with base as (
    select
      l.id, l.seller_id, l.title, l.description, l.condition,
      l.normal_price, l.bu_price, l.cod_available, l.area_label,
      round(st_y(l.geom::public.geometry)::numeric, 3)::double precision as approx_lat,
      round(st_x(l.geom::public.geometry)::numeric, 3)::double precision as approx_lng,
      l.boosted_until, l.created_at,
      c.slug as category_slug,
      pr.name as seller_name,
      rep.avg_rating as seller_rating,
      case when l.sale_type = 'BU' and l.bu_expires_at > now() then 'BU'::public.sale_type else 'NORMAL'::public.sale_type end as effective_sale_type,
      case when l.sale_type = 'BU' and l.bu_expires_at > now() then l.bu_price else l.normal_price end as eff_price,
      case when p_lat is not null and p_lng is not null
           then round((st_distance(l.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) / 1000)::numeric, 2)
           else null end as distance_km,
      case when p_lat is null or p_lng is null or p_radius_m is null then true
           else st_dwithin(l.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
      end as within_radius,
      (l.boosted_until is not null and l.boosted_until > now()) as boosted
    from public.listings l
    join public.categories c on c.id = l.category_id and c.active
    join public.profiles pr on pr.id = l.seller_id
    left join public.user_reputation rep on rep.user_id = l.seller_id
    where l.status = 'active'
      and (p_q is null or l.title ilike '%' || p_q || '%' or l.description ilike '%' || p_q || '%')
      and (p_category_slug is null or c.slug = p_category_slug)
      and (p_condition is null or l.condition = p_condition)
      and coalesce(case when l.sale_type='BU' and l.bu_expires_at>now() then l.bu_price else null end, l.normal_price) >= coalesce(p_min_price, 0)
      and coalesce(case when l.sale_type='BU' and l.bu_expires_at>now() then l.bu_price else null end, l.normal_price) <= coalesce(p_max_price, 9223372036854775807)
      and (not p_bu_only or (l.sale_type = 'BU' and l.bu_expires_at > now()))
      and (not p_cod_only or l.cod_available)
  ),
  scored as (
    select b.*,
      jsonb_build_object(
        'relevance', case when p_q is null then 0 when b.title ilike '%' || p_q || '%' then 2.0 when b.description ilike '%' || p_q || '%' then 1.0 else 0 end,
        'distance', case when b.distance_km is null then 0 else greatest(0, 5 - b.distance_km) * 0.8 end,
        'bu_score', case when b.effective_sale_type = 'BU' then 1.5 else 0 end,
        'price_score', case when b.eff_price <= 500000 then 1.0 when b.eff_price <= 2000000 then 0.7 when b.eff_price <= 10000000 then 0.4 else 0.1 end,
        'freshness', greatest(0, 3 - (extract(epoch from (now() - b.created_at)) / 86400) * 0.5),
        'seller_reputation', coalesce(b.seller_rating, 0) - 3,
        'cod_score', case when b.cod_available then 0.5 else 0 end,
        'boost_score', case when b.boosted then 2.0 else 0 end,
        'total', 0
      ) as score
    from base b
  )
  select id, seller_id, seller_name, seller_rating, category_slug, title, description,
         condition, normal_price, bu_price, effective_sale_type, cod_available,
         area_label, approx_lat, approx_lng, distance_km, boosted, created_at,
         jsonb_set(score, '{total}', to_jsonb((score->>'relevance')::numeric + (score->>'distance')::numeric + (score->>'bu_score')::numeric + (score->>'price_score')::numeric + (score->>'freshness')::numeric + (score->>'seller_reputation')::numeric + (score->>'cod_score')::numeric + (score->>'boost_score')::numeric))
  from scored
  order by
    case when p_sort = 'recommended' then within_radius::int end desc nulls last,
    case when p_sort = 'recommended' then ((score->>'relevance')::numeric + (score->>'distance')::numeric + (score->>'bu_score')::numeric + (score->>'price_score')::numeric + (score->>'freshness')::numeric + (score->>'seller_reputation')::numeric + (score->>'cod_score')::numeric + (score->>'boost_score')::numeric) end desc nulls last,
    case when p_sort = 'terdekat' then distance_km end asc nulls last,
    case when p_sort = 'termurah' then eff_price end asc nulls last,
    case when p_sort = 'termahal' then eff_price end desc nulls last,
    case when p_sort in ('recommended','terbaru') then created_at end desc,
    id
  limit least(coalesce(p_limit, 24), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.search_listings(text,text,public.listing_condition,bigint,bigint,boolean,boolean,double precision,double precision,int,text,int,int) to anon, authenticated;

-- 2) Coordinates for map-selected meeting points. Existing rows stay text-only.
alter table public.cod_requests
  add column if not exists meeting_geom public.geography(point, 4326),
  add column if not exists counter_meeting_geom public.geography(point, 4326);

create index if not exists codreq_meeting_geom_idx on public.cod_requests using gist (meeting_geom);

-- 3) Reciprocal per-user GPS consent. The legacy session flag remains for compatibility.
create table if not exists public.cod_location_sharing (
  session_id uuid not null references public.cod_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  enabled boolean not null default false,
  started_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table public.cod_location_sharing enable row level security;
revoke all on table public.cod_location_sharing from anon, authenticated;
grant select on table public.cod_location_sharing to authenticated;

drop policy if exists codshare_select_party on public.cod_location_sharing;
create policy codshare_select_party on public.cod_location_sharing
  for select to authenticated
  using (
    exists (
      select 1 from public.cod_sessions s
      where s.id = session_id
        and (s.buyer_id = (select auth.uid()) or s.seller_id = (select auth.uid()))
    )
  );

create index if not exists codshare_user_idx on public.cod_location_sharing(user_id, session_id);

-- A view gives the browser decimal coordinates instead of PostGIS binary output.
drop view if exists public.cod_location_points;
create view public.cod_location_points
with (security_invoker = true) as
select id, session_id, user_id,
       public.st_y(geom::public.geometry) as lat,
       public.st_x(geom::public.geometry) as lng,
       accuracy_m, recorded_at
from public.cod_locations;
grant select on public.cod_location_points to authenticated;

drop view if exists public.cod_session_map;
create view public.cod_session_map
with (security_invoker = true) as
select s.id, s.request_id, s.listing_id, s.buyer_id, s.seller_id, s.state,
       s.meeting_point, s.scheduled_at, s.sharing_enabled, s.last_state_actor,
       s.last_location_at, s.started_at, s.ended_at,
       public.st_y(s.meeting_geom::public.geometry) as meeting_lat,
       public.st_x(s.meeting_geom::public.geometry) as meeting_lng
from public.cod_sessions s;
grant select on public.cod_session_map to authenticated;

-- 4) Accept the original request with its selected point.
create or replace function public.accept_cod_request(p_request_id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_req public.cod_requests;
  v_session uuid;
begin
  if v_actor is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  select * into v_req from public.cod_requests r
   where r.id = p_request_id and r.seller_id = v_actor and r.status = 'requested' for update;
  if v_req.id is null then raise exception 'request tidak ditemukan / sudah direspons'; end if;

  update public.cod_requests set status = 'accepted', responded_at = now() where id = p_request_id;
  insert into public.cod_sessions
    (request_id, listing_id, buyer_id, seller_id, state, meeting_point, meeting_geom, scheduled_at)
  values
    (v_req.id, v_req.listing_id, v_req.buyer_id, v_req.seller_id, 'accepted', v_req.meeting_point, v_req.meeting_geom,
     (v_req.preferred_date + v_req.preferred_time) at time zone 'Asia/Jakarta')
  returning id into v_session;
  insert into public.transactions (session_id, listing_id, buyer_id, seller_id, agreed_price)
  values (v_session, v_req.listing_id, v_req.buyer_id, v_req.seller_id,
    coalesce((select l.bu_price from public.listings l where l.id = v_req.listing_id and l.sale_type = 'BU' and l.bu_expires_at > now()),
             (select l.normal_price from public.listings l where l.id = v_req.listing_id)));
  return v_session;
end;
$$;
revoke all on function public.accept_cod_request(uuid) from public;
grant execute on function public.accept_cod_request(uuid) to authenticated;

-- New overload requires coordinates for every new seller counter-offer.
create or replace function public.counter_cod_request(
  p_request_id uuid, p_date date, p_time time, p_point text,
  p_lat double precision, p_lng double precision
) returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then raise exception 'koordinat titik temu tidak valid'; end if;
  update public.cod_requests
     set status = 'countered', responded_at = now(), counter_date = p_date, counter_time = p_time,
         counter_meeting_point = p_point,
         counter_meeting_geom = public.st_setsrid(public.st_makepoint(p_lng, p_lat), 4326)::public.geography
   where id = p_request_id and seller_id = auth.uid() and status = 'requested';
  if not found then raise exception 'request tidak ditemukan / sudah direspons'; end if;
end;
$$;
revoke all on function public.counter_cod_request(uuid,date,time,text) from public;
revoke all on function public.counter_cod_request(uuid,date,time,text,double precision,double precision) from public;
grant execute on function public.counter_cod_request(uuid,date,time,text,double precision,double precision) to authenticated;

create or replace function public.accept_cod_counter(p_request_id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare v_req public.cod_requests; v_session uuid;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  select * into v_req from public.cod_requests r
   where r.id = p_request_id and r.buyer_id = auth.uid() and r.status = 'countered' for update;
  if v_req.id is null or v_req.counter_date is null or v_req.counter_time is null or v_req.counter_meeting_point is null then
    raise exception 'counter COD tidak ditemukan / sudah diproses';
  end if;
  update public.cod_requests set status = 'accepted', responded_at = now() where id = p_request_id;
  insert into public.cod_sessions
    (request_id, listing_id, buyer_id, seller_id, state, meeting_point, meeting_geom, scheduled_at)
  values (v_req.id, v_req.listing_id, v_req.buyer_id, v_req.seller_id, 'accepted', v_req.counter_meeting_point, v_req.counter_meeting_geom,
          (v_req.counter_date + v_req.counter_time) at time zone 'Asia/Jakarta')
  returning id into v_session;
  insert into public.transactions (session_id, listing_id, buyer_id, seller_id, agreed_price)
  values (v_session, v_req.listing_id, v_req.buyer_id, v_req.seller_id,
    coalesce((select l.bu_price from public.listings l where l.id = v_req.listing_id and l.sale_type = 'BU' and l.bu_expires_at > now()),
             (select l.normal_price from public.listings l where l.id = v_req.listing_id)));
  return v_session;
end;
$$;
revoke all on function public.accept_cod_counter(uuid) from public;
grant execute on function public.accept_cod_counter(uuid) to authenticated;

create or replace function public.cancel_cod_request(p_request_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  update public.cod_requests set status = 'cancelled', responded_at = now()
   where id = p_request_id and buyer_id = auth.uid() and status in ('requested','countered');
  if not found then raise exception 'request tidak ditemukan / sudah diproses'; end if;
end;
$$;
revoke all on function public.cancel_cod_request(uuid) from public;
grant execute on function public.cancel_cod_request(uuid) to authenticated;

-- 5) Make location sharing per-user and enforce it in both RPC and RLS.
create or replace function public.set_location_sharing(p_session_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare v_state public.cod_state; v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  select state into v_state from public.cod_sessions
   where id = p_session_id and (buyer_id = v_actor or seller_id = v_actor);
  if v_state is null then raise exception 'sesi tidak ditemukan'; end if;
  if p_enabled and v_state not in ('otw','near_location','arrived') then raise exception 'tracking baru aktif saat sesi OTW'; end if;
  insert into public.cod_location_sharing(session_id, user_id, enabled, started_at, updated_at)
  values (p_session_id, v_actor, p_enabled, case when p_enabled then now() else null end, now())
  on conflict (session_id, user_id) do update
    set enabled = excluded.enabled,
        started_at = case when excluded.enabled then coalesce(cod_location_sharing.started_at, excluded.started_at) else cod_location_sharing.started_at end,
        updated_at = now();
  update public.cod_sessions s set sharing_enabled = exists (
    select 1 from public.cod_location_sharing c where c.session_id = s.id and c.enabled
  ) where s.id = p_session_id;
end;
$$;
revoke all on function public.set_location_sharing(uuid,boolean) from public;
grant execute on function public.set_location_sharing(uuid,boolean) to authenticated;

create or replace function public.post_cod_location(
  p_session_id uuid, p_lat double precision, p_lng double precision, p_accuracy_m int default null
) returns public.post_location_result
language plpgsql
security definer set search_path = ''
as $$
declare v_actor uuid := auth.uid(); v_session public.cod_sessions; v_cfg jsonb; v_last record;
begin
  if v_actor is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then raise exception 'koordinat tidak valid'; end if;
  if p_accuracy_m is not null and (p_accuracy_m < 0 or p_accuracy_m > 10000) then raise exception 'akurasi tidak valid'; end if;
  select * into v_session from public.cod_sessions s where s.id = p_session_id and (s.buyer_id = v_actor or s.seller_id = v_actor);
  if v_session.id is null then raise exception 'sesi tidak ditemukan'; end if;
  if v_session.state not in ('otw','near_location','arrived') then raise exception 'tracking tidak aktif untuk sesi ini'; end if;
  if not exists (select 1 from public.cod_location_sharing c where c.session_id = p_session_id and c.user_id = v_actor and c.enabled) then
    raise exception 'sharing lokasi belum diaktifkan user';
  end if;
  select value into v_cfg from public.app_config where key = 'gps';
  select cl.geom, cl.recorded_at,
         public.st_distance(cl.geom, public.st_setsrid(public.st_makepoint(p_lng, p_lat), 4326)::public.geography) as dist
    into v_last from public.cod_locations cl where cl.session_id = p_session_id and cl.user_id = v_actor order by cl.recorded_at desc limit 1;
  if v_last.recorded_at is not null and extract(epoch from (clock_timestamp() - v_last.recorded_at)) * 1000 < coalesce((v_cfg->>'interval_ms')::bigint, 30000) then return 'throttled'; end if;
  if v_last.geom is not null and v_last.dist < coalesce((v_cfg->>'min_distance_m')::int, 50) then return 'throttled'; end if;
  insert into public.cod_locations (session_id, user_id, geom, accuracy_m, recorded_at)
  values (p_session_id, v_actor, public.st_setsrid(public.st_makepoint(p_lng, p_lat), 4326)::public.geography, p_accuracy_m, clock_timestamp());
  update public.cod_sessions set last_location_at = clock_timestamp() where id = p_session_id;
  return 'stored';
end;
$$;
revoke all on function public.post_cod_location(uuid,double precision,double precision,int) from public;
grant execute on function public.post_cod_location(uuid,double precision,double precision,int) to authenticated;

drop policy if exists codloc_select_party on public.cod_locations;
create policy codloc_select_reciprocal on public.cod_locations
  for select to authenticated
  using (
    exists (
      select 1 from public.cod_sessions s
      where s.id = session_id
        and (s.buyer_id = (select auth.uid()) or s.seller_id = (select auth.uid()))
    )
    and exists (
      select 1 from public.cod_location_sharing own
      where own.session_id = session_id and own.user_id = (select auth.uid()) and own.enabled
    )
    and exists (
      select 1 from public.cod_location_sharing subject
      where subject.session_id = session_id and subject.user_id = cod_locations.user_id and subject.enabled
    )
  );

-- Stop consent automatically once a session reaches a terminal state.
create or replace function public.disable_cod_location_sharing_on_end()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.state in ('completed','cancelled','no_show','disputed','expired') then
    update public.cod_location_sharing set enabled = false, updated_at = now() where session_id = new.id;
    new.sharing_enabled := false;
  end if;
  return new;
end;
$$;
drop trigger if exists codsessions_disable_location_sharing on public.cod_sessions;
create trigger codsessions_disable_location_sharing
  before update of state on public.cod_sessions
  for each row execute function public.disable_cod_location_sharing_on_end();
revoke execute on function public.disable_cod_location_sharing_on_end() from public, anon, authenticated;

-- Realtime changes are direct from Supabase; add publication entries only when absent.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cod_sessions') then
      alter publication supabase_realtime add table public.cod_sessions;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cod_locations') then
      alter publication supabase_realtime add table public.cod_locations;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cod_location_sharing') then
      alter publication supabase_realtime add table public.cod_location_sharing;
    end if;
  end if;
end $$;

-- Explicit grants for projects where new public objects are not auto-exposed.
grant select on public.cod_sessions, public.cod_locations, public.cod_location_sharing to authenticated;
