-- Simpan kontak privat saat signup, termasuk saat verifikasi email aktif dan
-- browser belum menerima session. Phone tetap hanya ada di tabel owner-only.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare v_phone text;
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Pengguna Baru')
  )
  on conflict (id) do nothing;

  v_phone := nullif(trim(new.raw_user_meta_data->>'phone'), '');
  if v_phone is not null then
    insert into public.user_contacts (user_id, phone)
    values (new.id, v_phone)
    on conflict (user_id) do update set phone = excluded.phone, updated_at = now();
  end if;
  return new;
end;
$$;
