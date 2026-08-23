-- Probe RLS conversations.insert — cetak tiap kondisi policy sebagai buyer B
begin;
create temp table dbg(line text);
grant select, insert on dbg to public;

create or replace function pg_temp.log(p text)
returns void language plpgsql security definer as $$
begin
  insert into dbg values (p);
end $$;

do $$
declare a uuid; b uuid; c uuid; l uuid; n int;
begin
  insert into auth.users (instance_id,id,aud,role,email,raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000',extensions.gen_random_uuid(),
          'authenticated','authenticated','pa@probe.local','{"name":"Seller A"}')
  returning id into a;
  insert into auth.users (instance_id,id,aud,role,email,raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000',extensions.gen_random_uuid(),
          'authenticated','authenticated','pb@probe.local','{"name":"Buyer B"}')
  returning id into b;
  insert into auth.users (instance_id,id,aud,role,email,raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000',extensions.gen_random_uuid(),
          'authenticated','authenticated','pc@probe.local','{"name":"Outsider C"}')
  returning id into c;

  -- Listing dibuat oleh A (BU seperti suite)
  perform set_config('role','authenticated',true);
  perform set_config('request.jwt.claims',
    json_build_object('sub',a::text,'role','authenticated')::text,true);
  insert into public.listings (seller_id,category_id,title,description,
    condition,normal_price,area_label,geom,cod_available,sale_type,bu_price,bu_expires_at)
  values (a,(select id from public.categories limit 1),'iPhone 13 128GB test unit',
    'deskripsi test','baik',6000000,'Bekasi Utara',
    st_setsrid(st_makepoint(106.9,-6.1),4326)::public.geography,true,
    'BU',4800000,now()+interval '3 days')
  returning id into l;

  -- boost oleh A
  perform public.purchase_boost(l,'boost_24h');

  -- visibilitas anon & C
  perform set_config('role','anon',true);
  perform set_config('request.jwt.claims','',true);
  select count(*) into n from public.listings where id=l;
  perform pg_temp.log('anon lihat aktif: '||n);

  perform set_config('role','authenticated',true);
  perform set_config('request.jwt.claims',
    json_build_object('sub',c::text,'role','authenticated')::text,true);
  select count(*) into n from public.listings where id=l;
  perform pg_temp.log('C lihat aktif: '||n);

  -- A: inactive -> active
  perform set_config('request.jwt.claims',
    json_build_object('sub',a::text,'role','authenticated')::text,true);
  update public.listings set status='inactive' where id=l;
  perform set_config('role','anon',true);
  perform pg_temp.log('cek-anon: current_user='||current_user||' session_user='||session_user);
  perform pg_temp.log('cek-anon: bypassrls='||(select rolbypassrls::text from pg_roles where rolname=current_user));
  perform pg_temp.log('cek-anon: auth.uid()='||coalesce(auth.uid()::text,'NULL'));
  select count(*) into n from public.listings where id=l;
  perform pg_temp.log('anon lihat inactive: '||n);
  perform set_config('request.jwt.claims',
    json_build_object('sub',a::text,'role','authenticated')::text,true);
  select count(*) into n from public.listings where id=l;
  perform pg_temp.log('owner lihat inactive: '||n);
  update public.listings set status='active' where id=l;

  -- B: update gagal
  perform set_config('request.jwt.claims',
    json_build_object('sub',b::text,'role','authenticated')::text,true);
  begin
    update public.listings set title='diretas' where id=l;
  exception when others then
    perform pg_temp.log('update B gagal (diantisipasi): '||sqlerrm);
  end;

  -- B buka conversation
  begin
    insert into public.conversations (listing_id,buyer_id,seller_id)
    values (l,b,a);
    perform pg_temp.log('INSERT OK');
  exception when others then
    perform pg_temp.log('ERR: '||sqlerrm);
  end;

  perform set_config('role','postgres',true);
end $$;

select line from dbg order by line;
rollback;
