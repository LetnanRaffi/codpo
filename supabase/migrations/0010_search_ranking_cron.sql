-- Search, sort, ranking deterministic (PRD §19-21) + cron jobs.
-- PostGIS: radius pakai ST_DWithin (meter), jarak ST_Distance — bukan haversine app-layer.

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
security invoker set search_path = ''
as $$
  with base as (
    select
      l.id, l.seller_id, l.title, l.description, l.condition,
      l.normal_price, l.bu_price, l.cod_available, l.area_label,
      st_y(st_snaptogrid(l.geom::geometry, 0.001)) as approx_lat,
      st_x(st_snaptogrid(l.geom::geometry, 0.001)) as approx_lng,
      l.boosted_until, l.created_at,
      c.slug as category_slug,
      pr.name as seller_name,
      rep.avg_rating as seller_rating,
      case when l.sale_type = 'BU' and l.bu_expires_at > now() then 'BU'::public.sale_type else 'NORMAL'::public.sale_type end as effective_sale_type,
      case when l.sale_type = 'BU' and l.bu_expires_at > now() then l.bu_price else l.normal_price end as eff_price,
      case when p_lat is not null and p_lng is not null
           then round((st_distance(l.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) / 1000)::numeric, 2)
           else null end as distance_km,
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
      and (p_lat is null or p_lng is null or p_radius_m is null
           or st_dwithin(l.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m))
  ),
  scored as (
    select b.*,
      -- Komponen skor deterministik & explainable (PRD §21). Bobot: jarak dominan.
      jsonb_build_object(
        'relevance', case
            when p_q is null then 0
            when b.title ilike '%' || p_q || '%' then 2.0
            when b.description ilike '%' || p_q || '%' then 1.0
            else 0 end,
        'distance', case when b.distance_km is null then 0
            else greatest(0, 5 - b.distance_km) * 0.8 end,
        'bu_score', case when b.effective_sale_type = 'BU' then 1.5 else 0 end,
        'price_score', case
            when b.eff_price <= 500000 then 1.0
            when b.eff_price <= 2000000 then 0.7
            when b.eff_price <= 10000000 then 0.4
            else 0.1 end,
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
         jsonb_set(score, '{total}',
           to_jsonb((score->>'relevance')::numeric
                  + (score->>'distance')::numeric
                  + (score->>'bu_score')::numeric
                  + (score->>'price_score')::numeric
                  + (score->>'freshness')::numeric
                  + (score->>'seller_reputation')::numeric
                  + (score->>'cod_score')::numeric
                  + (score->>'boost_score')::numeric))
  from scored
  order by
    case when p_sort = 'recommended' then
      ((score->>'relevance')::numeric + (score->>'distance')::numeric
       + (score->>'bu_score')::numeric + (score->>'price_score')::numeric
       + (score->>'freshness')::numeric + (score->>'seller_reputation')::numeric
       + (score->>'cod_score')::numeric + (score->>'boost_score')::numeric)
    end desc nulls last,
    case when p_sort = 'terdekat' then distance_km end asc nulls last,
    case when p_sort = 'termurah' then eff_price end asc nulls last,
    case when p_sort = 'termahal' then eff_price end desc nulls last,
    case when p_sort in ('recommended','terbaru') then created_at end desc,
    id
  limit least(coalesce(p_limit, 24), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

grant execute on function public.search_listings(text,text,public.listing_condition,bigint,bigint,boolean,boolean,double precision,double precision,int,text,int,int) to anon, authenticated;

-- ============ BU EXPIRY (PRD §16): on-read guard di query + pg_cron normalisasi ============
create or replace function public.expire_bu_listings()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.listings
     set sale_type = 'NORMAL'
   where sale_type = 'BU' and bu_expires_at <= now();
end;
$$;

revoke execute on function public.expire_bu_listings() from anon, authenticated;

-- Cron (Supabase Dashboard → Integrations → Cron untuk monitoring).
select cron.schedule('expire-bu-listings', '*/10 * * * *', 'select public.expire_bu_listings();');
select cron.schedule('purge-cod-locations', '17 * * * *', 'select public.purge_cod_locations();');
select cron.schedule('expire-stale-sessions', '3 * * * *', 'select public.expire_stale_cod_sessions();');

-- Reminder COD H+0 (sesi terjadwal hari ini, belum OTW) — PRD §42.
create or replace function public.notify_cod_reminders()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  perform public.notify(s.buyer_id, 'cod_reminder', 'Ingat COD hari ini',
    format('Sesi COD kamu terjadwal %s di %s.', to_char(s.scheduled_at, 'HH24:MI'), s.meeting_point),
    jsonb_build_object('session_id', s.id))
  from public.cod_sessions s
  where s.state = 'scheduled'
    and s.scheduled_at between now() and now() + interval '6 hours';
end;
$$;

revoke execute on function public.notify_cod_reminders() from anon, authenticated;

select cron.schedule('cod-reminders', '0 * * * *', 'select public.notify_cod_reminders();');
