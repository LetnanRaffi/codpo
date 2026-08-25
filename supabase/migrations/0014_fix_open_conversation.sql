-- open_conversation memvalidasi actor/listing secara eksplisit. SECURITY DEFINER
-- diperlukan karena policy INSERT lama menjalankan subquery lintas tabel di
-- bawah RLS dan menolak buyer valid pada project hosted.
create or replace function public.open_conversation(p_listing_id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_seller uuid;
begin
  if v_actor is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_actor and p.status = 'active'
  ) then
    raise exception 'akun tidak aktif' using errcode = '42501';
  end if;

  select l.seller_id into v_seller
  from public.listings l
  where l.id = p_listing_id and l.status = 'active';

  if v_seller is null then raise exception 'listing tidak ditemukan/aktif'; end if;
  if v_seller = v_actor then raise exception 'tidak bisa chat listing sendiri'; end if;

  select c.id into v_id
  from public.conversations c
  where c.listing_id = p_listing_id and c.buyer_id = v_actor
  limit 1;

  if v_id is null then
    insert into public.conversations (listing_id, buyer_id, seller_id)
    values (p_listing_id, v_actor, v_seller)
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

revoke all on function public.open_conversation(uuid) from public;
grant execute on function public.open_conversation(uuid) to authenticated;
