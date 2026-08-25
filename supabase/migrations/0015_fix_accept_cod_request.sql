-- Accept adalah mutasi multi-tabel atomik. SECURITY INVOKER tidak dapat insert
-- ke cod_sessions/transactions (sengaja tidak ada policy insert langsung),
-- jadi fungsi memakai DEFINER dengan verifikasi seller eksplisit.
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

  select * into v_req
  from public.cod_requests r
  where r.id = p_request_id
    and r.seller_id = v_actor
    and r.status = 'requested'
  for update;

  if v_req.id is null then raise exception 'request tidak ditemukan / sudah direspons'; end if;

  update public.cod_requests
  set status = 'accepted', responded_at = now()
  where id = p_request_id;

  insert into public.cod_sessions
    (request_id, listing_id, buyer_id, seller_id, state, meeting_point, scheduled_at)
  values
    (v_req.id, v_req.listing_id, v_req.buyer_id, v_req.seller_id,
     'accepted', v_req.meeting_point,
     (v_req.preferred_date + v_req.preferred_time) at time zone 'Asia/Jakarta')
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

revoke all on function public.accept_cod_request(uuid) from public;
grant execute on function public.accept_cod_request(uuid) to authenticated;
