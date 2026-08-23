-- Diagnosa conversations.insert di level DB murni
begin;
create temp table dbg(line text);
grant select, insert on dbg to public;
create or replace function pg_temp.log(p text) returns void
language plpgsql security definer as $$
begin insert into dbg values (p); end $$;

do $$
declare a uuid; b uuid; l uuid;
begin
  insert into auth.users (instance_id,id,aud,role,email,raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000',extensions.gen_random_uuid(),
          'authenticated','authenticated','da@diag.local','{"name":"Seller D"}')
  returning id into a;
  insert into auth.users (instance_id,id,aud,role,email,raw_user_meta_data)
  values ('00000000-0000-0000-0000-000000000000',extensions.gen_random_uuid(),
          'authenticated','authenticated','db@diag.local','{"name":"Buyer D"}')
  returning id into b;

  insert into public.listings (seller_id,category_id,title,description,
    condition,normal_price,area_label,geom,cod_available)
  values (a,(select id from public.categories limit 1),'Diag unit',
    'x','baik',1000,'Bekasi',st_setsrid(st_makepoint(106.9,-6.1),4326)::public.geography,true)
  returning id into l;

  perform pg_temp.log('setup ok: listing='||l);

  -- sebagai B
  perform set_config('request.jwt.claim.sub', b::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub',b::text,'role','authenticated')::text,true);
  perform set_config('role','authenticated',true);

  perform pg_temp.log('uid='||coalesce(auth.uid()::text,'NULL'));
  perform pg_temp.log('seller='||(select seller_id::text from public.listings where id=l));

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
