-- Counter view atomik untuk halaman detail dan API. SECURITY DEFINER diperlukan
-- karena pengunjung anonim tidak punya izin update listing secara langsung.
create or replace function public.increment_listing_views(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listings
  set views = views + 1
  where id = p_id and status = 'active';
end;
$$;

revoke all on function public.increment_listing_views(uuid) from public;
grant execute on function public.increment_listing_views(uuid) to anon, authenticated;
