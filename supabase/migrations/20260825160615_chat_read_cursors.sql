-- Cursor baca per participant. Pesan tetap immutable; hanya posisi baca yang berubah.
create table public.conversation_reads (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_reads enable row level security;

create policy "conversation_reads_select_own"
  on public.conversation_reads for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = conversation_reads.conversation_id
        and cp.user_id = (select auth.uid())
    )
  );

create policy "conversation_reads_insert_own"
  on public.conversation_reads for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = conversation_reads.conversation_id
        and cp.user_id = (select auth.uid())
    )
  );

create policy "conversation_reads_update_own"
  on public.conversation_reads for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.conversation_participants cp
      where cp.conversation_id = conversation_reads.conversation_id
        and cp.user_id = (select auth.uid())
    )
  );

create index conversation_reads_user_idx
  on public.conversation_reads(user_id, conversation_id);

grant select, insert, update on public.conversation_reads to authenticated;
revoke all on public.conversation_reads from anon;

-- Inbox dihitung di database supaya tidak melakukan query N+1 dari route handler.
create or replace function public.get_conversation_inbox()
returns table (
  id uuid,
  listing_id uuid,
  buyer_id uuid,
  seller_id uuid,
  last_message_at timestamptz,
  created_at timestamptz,
  listing_title text,
  other_user_name text,
  last_message text,
  unread_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    c.listing_id,
    c.buyer_id,
    c.seller_id,
    c.last_message_at,
    c.created_at,
    coalesce(l.title, 'Listing') as listing_title,
    coalesce(p.name, 'Pengguna') as other_user_name,
    coalesce(latest.body, case when latest.type is not null then 'Lampiran' else '' end) as last_message,
    (
      select count(*)
      from public.messages unread
      where unread.conversation_id = c.id
        and unread.sender_id <> (select auth.uid())
        and unread.created_at > coalesce(cr.last_read_at, '-infinity'::timestamptz)
    ) as unread_count
  from public.conversations c
  join public.conversation_participants cp
    on cp.conversation_id = c.id
   and cp.user_id = (select auth.uid())
  left join public.listings l on l.id = c.listing_id
  left join public.profiles p
    on p.id = case
      when c.buyer_id = (select auth.uid()) then c.seller_id
      else c.buyer_id
    end
  left join public.conversation_reads cr
    on cr.conversation_id = c.id
   and cr.user_id = (select auth.uid())
  left join lateral (
    select m.body, m.type
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) latest on true
  order by c.last_message_at desc nulls last, c.created_at desc;
$$;

revoke all on function public.get_conversation_inbox() from public, anon;
grant execute on function public.get_conversation_inbox() to authenticated;
