-- ============================================================
-- CODPO RLS TEST SUITE
-- Jalankan di Supabase Dashboard → SQL Editor (atau psql project ASLI).
-- Output: PASS/FAIL per kasus via NOTICE. Semua HARUS PASS.
-- Satu transaksi besar + ROLLBACK di akhir → data uji tidak menempel.
--
-- Mekanisme: insert user uji langsung ke auth.users (sebagai postgres),
-- lalu SET ROLE authenticated + JWT claims per user → policy nyata teruji.
-- ============================================================

begin;

create temp table __results (name text, pass boolean) on commit drop;

create or replace function pg_temp.__assert(p_name text, p_ok boolean)
returns void language plpgsql as $$
begin
  insert into __results values (p_name, p_ok);
  raise notice '% — %', case when p_ok then 'PASS' else 'FAIL ***' end, p_name;
end $$;

create or replace function pg_temp.__as(p_uid uuid)
returns void language sql as $$
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid::text, 'role', 'authenticated')::text, true);
$$;

create or replace function pg_temp.__as_anon()
returns void language sql as $$
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '', true);
$$;

do $$
declare
  a uuid; b uuid; c uuid;
  l uuid; cv uuid; req uuid; sess uuid; trx_id uuid; loc_id bigint;
  n int; v_uid uuid; v_txt text; rep record;
begin
  truncate __results;

  -- ================= SETUP: 3 USER =================
  insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000',
          extensions.gen_random_uuid(), 'authenticated','authenticated',
          'a@test.local', '{"name":"Seller A"}')
  returning id into a;

  insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000',
          extensions.gen_random_uuid(), 'authenticated','authenticated',
          'b@test.local', '{"name":"Buyer B"}')
  returning id into b;

  insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000',
          extensions.gen_random_uuid(), 'authenticated','authenticated',
          'c@test.local', '{"name":"Outsider C"}')
  returning id into c;

  select count(*) into n from public.profiles where id in (a,b,c);
  perform pg_temp.__assert('trigger signup membuat 3 profil', n = 3);

  -- Listing BU milik A (aktif, COD tersedia)
  perform pg_temp.__as(a);
  insert into public.listings (seller_id, category_id, title, description,
    condition, normal_price, area_label, geom, cod_available, sale_type,
    bu_price, bu_expires_at)
  values (a, (select id from public.categories limit 1), 'iPhone 13 128GB test unit',
    'deskripsi test', 'baik', 6000000, 'Bekasi Utara',
    st_setsrid(st_makepoint(106.9, -6.1),4326)::geography, true,
    'BU', 4800000, now() + interval '3 days')
  returning id into l;

  -- Boost oleh pemilik sukses; boosted_until terisi
  begin
    perform public.purchase_boost(l, 'boost_24h');
    select (boosted_until > now())::int into n from public.listings where id = l;
    perform pg_temp.__assert('A beli boost → listing boosted', n = 1);
  exception when others then
    perform pg_temp.__assert('A beli boost → listing boosted', false);
  end;

  -- B beli boost listing A → ditolak
  perform pg_temp.__as(b);
  begin
    perform public.purchase_boost(l, 'boost_3d');
    perform pg_temp.__assert('boost listing orang lain DITOLAK', false);
  exception when others then
    perform pg_temp.__assert('boost listing orang lain DITOLAK', true);
  end;

  -- ================= VISIBILITY LISTING =================
  perform pg_temp.__as_anon();
  select count(*) into n from public.listings where id = l;
  perform pg_temp.__assert('anon lihat listing aktif', n = 1);

  perform pg_temp.__as(c);
  select count(*) into n from public.listings where id = l;
  perform pg_temp.__assert('user lain lihat listing aktif', n = 1);

  perform pg_temp.__as(a);
  update public.listings set status = 'inactive' where id = l;
  perform pg_temp.__as_anon();
  select count(*) into n from public.listings where id = l;
  perform pg_temp.__assert('anon TIDAK lihat listing inactive', n = 0);
  perform pg_temp.__as(a);
  select count(*) into n from public.listings where id = l;
  perform pg_temp.__assert('owner tetap lihat miliknya (inactive)', n = 1);
  update public.listings set status = 'active' where id = l;

  perform pg_temp.__as(b);
  begin
    update public.listings set title = 'diretas' where id = l;
    perform pg_temp.__assert('B TIDAK bisa update listing A', false);
  exception when others then
    perform pg_temp.__assert('B TIDAK bisa update listing A', true);
  end;

  -- ================= CHAT =================
  perform pg_temp.__as(b);
  select public.open_conversation(l) into cv;
  perform pg_temp.__assert('B buka conversation listing A', cv is not null);

  perform pg_temp.__as(a);
  select count(*) into n from public.conversations where id = cv;
  perform pg_temp.__assert('A (seller) ikut bisa baca conversation', n = 1);

  perform pg_temp.__as(c);
  select count(*) into n from public.conversations where id = cv;
  perform pg_temp.__assert('C TIDAK bisa baca conversation A-B', n = 0);

  begin
    insert into public.messages (conversation_id, sender_id, type, body)
    values (cv, c, 'text', 'halo ane outsider');
    perform pg_temp.__assert('C TIDAK bisa kirim pesan ke conv A-B', false);
  exception when others then
    perform pg_temp.__assert('C TIDAK bisa kirim pesan ke conv A-B', true);
  end;

  perform pg_temp.__as(b);
  insert into public.messages (conversation_id, sender_id, type, body)
  values (cv, b, 'text', 'gan masih ready?');
  perform pg_temp.__assert('B kirim pesan OK', true);

  -- ================= COD REQUEST + ACCEPT =================
  perform pg_temp.__as(b);
  insert into public.cod_requests (listing_id, buyer_id, seller_id,
    preferred_date, preferred_time, meeting_point)
  values (l, b, a, current_date + 1, '15:00', 'Alun-alun Bekasi')
  returning id into req;
  perform pg_temp.__assert('B ajukan COD', req is not null);

  perform pg_temp.__as(b);
  begin
    perform public.accept_cod_request(req);
    perform pg_temp.__assert('accept HANYA oleh seller', false);
  exception when others then
    perform pg_temp.__assert('accept HANYA oleh seller', true);
  end;

  perform pg_temp.__as(a);
  select public.accept_cod_request(req) into sess;
  perform pg_temp.__assert('A accept → session dibuat', sess is not null);

  select id into trx_id from public.transactions where session_id = sess;
  perform pg_temp.__assert('transaction pending dibuat otomatis', trx_id is not null);

  -- ================= STATE MACHINE =================
  perform pg_temp.__as(b);
  begin
    perform public.cod_transition(sess, 'completed');
    perform pg_temp.__assert('loncat accepted→completed DITOLAK', false);
  exception when others then
    perform pg_temp.__assert('loncat accepted→completed DITOLAK', true);
  end;

  select public.cod_transition(sess, 'scheduled') into v_txt;
  perform pg_temp.__assert('B konfirmasi jadwal (accepted→scheduled)',
    v_txt::text = 'scheduled');

  perform pg_temp.__as(a);
  begin
    perform public.cod_transition(sess, 'item_check');
    perform pg_temp.__assert('item_check HANYA buyer', false);
  exception when others then
    perform pg_temp.__assert('item_check HANYA buyer', true);
  end;

  -- ================= LIVE TRACKING =================
  perform pg_temp.__as(b);
  begin
    perform public.post_cod_location(sess, -6.1, 106.9, 10);
    perform pg_temp.__assert('post lokasi sebelum sharing aktif → ditolak', false);
  exception when others then
    perform pg_temp.__assert('post lokasi sebelum sharing aktif → ditolak', true);
  end;

  perform public.set_location_sharing(sess, true);

  begin
    perform public.post_cod_location(sess, -6.1, 106.9, 10);
    perform pg_temp.__assert('tracking saat belum OTW → ditolak', false);
  exception when others then
    perform pg_temp.__assert('tracking saat belum OTW → ditolak', true);
  end;

  perform public.cod_transition(sess, 'otw');

  perform public.post_cod_location(sess, -6.1, 106.9, 10) into v_txt;
  perform pg_temp.__assert('titik pertama tersimpan', v_txt::text = 'stored');

  perform public.post_cod_location(sess, -6.10001, 106.9, 10) into v_txt;
  perform pg_temp.__assert('throttle jarak <50m → throttled',
    v_txt::text = 'throttled');

  -- purge self-scope: titik A & B dalam SESI SAMA, purge A hanya hapus titik A
  perform pg_temp.__as(a);
  perform public.set_location_sharing(sess, true);
  perform public.cod_transition(sess, 'near_location');
  perform public.post_cod_location(sess, -6.11, 106.9, 10) into v_txt;

  select count(*) into n from public.cod_locations where session_id = sess;
  perform pg_temp.__assert('dua titik tersimpan (A & B)', n = 2);

  perform pg_temp.__as(a);
  perform public.purge_my_locations(sess);
  select count(*) into n from public.cod_locations where session_id = sess;
  select user_id into v_uid from public.cod_locations where session_id = sess limit 1;
  perform pg_temp.__assert('purge A hanya hapus titik A (punya B aman)',
    n = 1 and v_uid = b);

  -- ================= COMPLETION + REVIEW =================
  perform pg_temp.__as(a);
  perform public.cod_transition(sess, 'arrived');
  perform pg_temp.__as(b);
  perform public.cod_transition(sess, 'item_check');
  perform public.cod_transition(sess, 'completed');

  select status::text into v_txt from public.transactions where id = trx_id;
  perform pg_temp.__assert('trx sinkron jadi completed', v_txt = 'completed');

  select status::text into v_txt from public.listings where id = l;
  perform pg_temp.__assert('listing otomatis sold', v_txt = 'sold');

  perform pg_temp.__as(b);
  insert into public.reviews (transaction_id, reviewer_id, reviewee_id, rating, body)
  values (trx_id, b, a, 5, 'mulus gan');
  perform pg_temp.__assert('B review A (5 stars)', true);

  begin
    insert into public.reviews (transaction_id, reviewer_id, reviewee_id, rating)
    values (trx_id, b, a, 1);
    perform pg_temp.__assert('duplicate review DITOLAK', false);
  exception when others then
    perform pg_temp.__assert('duplicate review DITOLAK', true);
  end;

  perform pg_temp.__as(a);
  insert into public.reviews (transaction_id, reviewer_id, reviewee_id, rating)
  values (trx_id, a, b, 4);
  perform pg_temp.__assert('A review balas ke B', true);

  perform pg_temp.__as(c);
  begin
    insert into public.reviews (transaction_id, reviewer_id, reviewee_id, rating)
    values (trx_id, c, a, 1);
    perform pg_temp.__assert('C (bukan pihak) review DITOLAK', false);
  exception when others then
    perform pg_temp.__assert('C (bukan pihak) review DITOLAK', true);
  end;

  select * into rep from public.user_reputation where user_id = a;
  perform pg_temp.__assert('reputasi A ter-update (avg 5.0)',
    rep.avg_rating = 5.0::numeric);

  -- ================= REPORTS + ADMIN =================
  perform pg_temp.__as(b);
  insert into public.reports (reporter_id, target_type, target_id, reason)
  values (b, 'listing', l, 'fake_item');

  perform pg_temp.__as(a);
  select count(*) into n from public.reports;
  perform pg_temp.__assert('report privat dari non-admin', n = 0);

  insert into public.admin_users (user_id) values (c);
  perform pg_temp.__as(c);
  select count(*) into n from public.reports;
  perform pg_temp.__assert('admin bisa lihat semua report', n >= 1);

  update public.reports
     set status = 'resolved', resolution_note = 'diverifikasi palsu'
   where reporter_id = b;
  perform pg_temp.__assert('admin resolve report', true);

  select count(*) into n from public.admin_actions
   where admin_id = c and action like 'report.%';
  perform pg_temp.__assert('audit trail admin_actions tercatat', n >= 1);

  -- ================= GUARD PROFIL =================
  perform pg_temp.__as(a);
  begin
    update public.profiles set status = 'suspended' where id = a;
    perform pg_temp.__assert('user biasa TIDAK bisa suspend diri sendiri', false);
  exception when others then
    perform pg_temp.__assert('user biasa TIDAK bisa suspend diri sendiri', true);
  end;

  -- ================= RINGKASAN =================
  raise notice '================ HASIL ================';
  raise notice 'PASSED  : %', (select count(*) from __results where pass);
  raise notice 'FAILED  : %', (select count(*) from __results where not pass);
end $$;

rollback;
