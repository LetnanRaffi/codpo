-- Izinkan hanya RPC counter resmi melewati guard kolom views. Marker bersifat
-- transaction-local dan tidak dapat dipakai user untuk melewati RLS update.
create or replace function public.guard_listing_owner_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.seller_id <> old.seller_id then
    raise exception 'seller_id tidak bisa diubah';
  end if;
  if new.views <> old.views
     and coalesce(current_setting('codpo.increment_views', true), '') <> 'on' then
    raise exception 'views hanya bertambah via sistem';
  end if;
  if new.status = 'removed' and auth.uid() is not null and not public.is_admin() then
    raise exception 'status removed hanya lewat moderasi admin';
  end if;
  return new;
end;
$$;

create or replace function public.increment_listing_views(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('codpo.increment_views', 'on', true);
  update public.listings
  set views = views + 1
  where id = p_id and status = 'active';
end;
$$;

revoke all on function public.increment_listing_views(uuid) from public;
grant execute on function public.increment_listing_views(uuid) to anon, authenticated;
