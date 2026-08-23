-- Cleanup total schema lama (approved oleh owner).
-- Urutan: trigger di auth.users → fungsi publik → tabel/view/MV → enum → jejak migrasi.

-- 1. Trigger non-internal di auth.users (bootstrap lama + punya kita ikut ke-drop, dibuat ulang migration)
do $$
declare r record;
begin
  for r in select tgname from pg_trigger
           where tgrelid = 'auth.users'::regclass and not tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users', r.tgname);
  end loop;
end $$;

-- 2. Semua fungsi di schema public KECUALI milik extension
do $$
declare r record;
begin
  for r in select p.oid::regprocedure::text as sig
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and not exists (
               select 1 from pg_depend d
                where d.objid = p.oid and d.classid = 'pg_proc'::regclass and d.deptype = 'e'
             )
  loop
    execute format('drop function if exists public.%s cascade', r.sig);
  end loop;
end $$;

-- 3. Materialized views → views → tabel (skip relasi milik extension)
do $$
declare r record;
begin
  for r in select c.relname, c.relkind
           from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('m','v','r','p')
             and not exists (
               select 1 from pg_depend d
                where d.objid = c.oid and d.classid = 'pg_class'::regclass and d.deptype = 'e'
             )
  loop
    if r.relkind = 'm' then
      execute format('drop materialized view if exists public.%I cascade', r.relname);
    elsif r.relkind in ('v','p') then
      execute format('drop view if exists public.%I cascade', r.relname);
    end if;
  end loop;

  for r in select c.relname
           from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r','p')
             and not exists (
               select 1 from pg_depend d
                where d.objid = c.oid and d.classid = 'pg_class'::regclass and d.deptype = 'e'
             )
  loop
    execute format('drop table if exists public.%I cascade', r.relname);
  end loop;
end $$;

-- 4. Enum types
do $$
declare r record;
begin
  for r in select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
           where n.nspname = 'public' and t.typtype = 'e'
  loop
    execute format('drop type if exists public.%I cascade', r.typname);
  end loop;
end $$;

-- 5. Hapus akun probe/test lama dari auth
delete from auth.users where email like 'probe%' or email like 'codpo.test.%';
