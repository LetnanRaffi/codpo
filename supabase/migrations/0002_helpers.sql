-- Helper functions dipakai lintas tabel & RLS policies.
-- Semua security definer + search_path terkunci (best practice Supabase).

-- updated_at otomatis
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Admin check — sumber tunggal untuk semua policy/endpoint admin (PRD §43).
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

-- Bootstrap profile otomatis saat signup Supabase Auth (PRD §6: satu akun, switch mode).
-- Nama diambil dari metadata signup; email TIDAK disalin ke profiles (tetap privat di auth.users).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Pengguna Baru')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
