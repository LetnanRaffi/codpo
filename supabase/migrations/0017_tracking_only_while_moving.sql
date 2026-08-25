-- Lokasi baru hanya diterima setelah participant benar-benar berangkat.
-- accepted/scheduled masih boleh toggle consent, tetapi belum boleh kirim titik.
create or replace function public.post_cod_location(
  p_session_id uuid, p_lat double precision, p_lng double precision, p_accuracy_m int default null
) returns public.post_location_result
language plpgsql
security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_session public.cod_sessions;
  v_cfg jsonb;
  v_last record;
begin
  if v_actor is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  select * into v_session from public.cod_sessions s
  where s.id = p_session_id and (s.buyer_id = v_actor or s.seller_id = v_actor);
  if v_session.id is null then raise exception 'sesi tidak ditemukan'; end if;
  if v_session.state not in ('otw','near_location','arrived') then
    raise exception 'tracking tidak aktif untuk sesi ini';
  end if;
  if not v_session.sharing_enabled then raise exception 'sharing lokasi belum diaktifkan user'; end if;

  select value into v_cfg from public.app_config where key = 'gps';
  select cl.geom, cl.recorded_at,
         public.st_distance(cl.geom, public.st_setsrid(public.st_makepoint(p_lng, p_lat), 4326)::public.geography) as dist
  into v_last from public.cod_locations cl
  where cl.session_id = p_session_id and cl.user_id = v_actor
  order by cl.recorded_at desc limit 1;

  if v_last.recorded_at is not null
     and extract(epoch from (clock_timestamp() - v_last.recorded_at)) * 1000
       < coalesce((v_cfg->>'interval_ms')::bigint, 30000) then return 'throttled'; end if;
  if v_last.geom is not null
     and v_last.dist < coalesce((v_cfg->>'min_distance_m')::int, 50) then return 'throttled'; end if;

  insert into public.cod_locations (session_id, user_id, geom, accuracy_m, recorded_at)
  values (p_session_id, v_actor,
          public.st_setsrid(public.st_makepoint(p_lng, p_lat), 4326)::public.geography,
          p_accuracy_m, clock_timestamp());
  update public.cod_sessions set last_location_at = clock_timestamp() where id = p_session_id;
  return 'stored';
end;
$$;

revoke all on function public.post_cod_location(uuid,double precision,double precision,int) from public;
grant execute on function public.post_cod_location(uuid,double precision,double precision,int) to authenticated;
