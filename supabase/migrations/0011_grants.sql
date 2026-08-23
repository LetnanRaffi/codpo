-- Privileges: tabel dibuat via role non-postgres (Management API) sehingga
-- perlu grant eksplisit agar REST/client bisa akses sesuai RLS masing-masing.

grant usage on schema public to anon, authenticated, service_role;

-- Service role: penuh (bypass RLS tetap butuh grant tabel)
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Client: akses tabel dikendalikan RLS; grant diperlukan sebagai lapis dasar.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- View publik
grant select on public.listing_public to anon, authenticated;
grant select on public.user_reputation to anon, authenticated;

-- Functions
grant execute on all functions in schema public to anon, authenticated;

-- Tarik kembali fungsi sensitif dari client (dipanggil sistem/admin saja)
revoke execute on function public.is_admin() from anon, authenticated;
revoke execute on function public.notify(uuid,text,text,text,jsonb) from anon, authenticated;
revoke execute on function public.refresh_user_reputation() from anon, authenticated;
revoke execute on function public.expire_bu_listings() from anon, authenticated;
revoke execute on function public.expire_stale_cod_sessions() from anon, authenticated;
revoke execute on function public.purge_cod_locations() from anon, authenticated;
revoke execute on function public.notify_cod_reminders() from anon, authenticated;

-- Default privileges untuk tabel/fungsi yang dibuat postgres/supabase_admin ke depan
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated;
