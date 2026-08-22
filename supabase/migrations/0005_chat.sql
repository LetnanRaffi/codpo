-- Chat kontekstual per listing (PRD §24, §26).
-- RLS: participant-only, lewat conversation_participants.

create type public.message_type as enum ('text','image','system','location','cod_action');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  unique (listing_id, buyer_id),
  constraint buyer_not_seller check (buyer_id <> seller_id)
);

-- Membership kanonik — RLS chat lewat tabel ini (PRD §26).
create table public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;

create policy "conversations_select_participant"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id and cp.user_id = auth.uid()
    )
  );

-- Buyer membuka chat: dia buyer-nya, seller harus owner listing yang aktif.
create policy "conversations_insert_buyer"
  on public.conversations for insert
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = seller_id and l.status = 'active'
    )
    and exists (select 1 from public.profiles p where p.id = buyer_id and p.status = 'active')
  );

create policy "participants_select_own"
  on public.conversation_participants for select
  using (user_id = auth.uid());

-- Trigger isi participants otomatis.
create or replace function public.fill_conversation_participants()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.conversation_participants (conversation_id, user_id)
  values (new.id, new.buyer_id), (new.id, new.seller_id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger conversations_fill_participants
  after insert on public.conversations
  for each row execute function public.fill_conversation_participants();

create index participants_user_idx on public.conversation_participants(user_id);
create index conversations_listing_idx on public.conversations(listing_id);
create index conversations_last_msg_idx on public.conversations(last_message_at desc nulls last);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  type public.message_type not null default 'text',
  body text not null default '' check (char_length(body) <= 2000),
  media_key text check (
    media_key is null or media_key ~ '^chats/[a-f0-9-]{36}/[a-zA-Z0-9._-]{8,120}$'
  ),
  payload jsonb,
  created_at timestamptz not null default now(),
  constraint body_or_media check (
    (type in ('text','system') and char_length(btrim(body)) > 0)
    or (type in ('image','location','cod_action'))
  )
);

alter table public.messages enable row level security;

create policy "messages_select_participant"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

create policy "messages_insert_participant"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

-- Tidak ada update/delete policy → chat immutable (audit-friendly).

-- last_message_at ikut update (buat sorting inbox).
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

create index messages_conversation_created_idx on public.messages(conversation_id, created_at desc);

-- Realtime untuk messages (PRD §26). Publication bawaan Supabase; aman kalau belum ada.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- RPC: find-or-create conversation kontekstual per listing (dipanggil endpoint POST /api/conversations).
create or replace function public.open_conversation(p_listing_id uuid)
returns uuid
language plpgsql
security invoker set search_path = ''
as $$
declare v_id uuid; v_seller uuid;
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode='42501'; end if;
  select seller_id into v_seller from public.listings
   where id = p_listing_id and status = 'active';
  if v_seller is null then raise exception 'listing tidak ditemukan/aktif'; end if;
  if v_seller = auth.uid() then raise exception 'tidak bisa chat listing sendiri'; end if;

  select c.id into v_id from public.conversations c
   where c.listing_id = p_listing_id and c.buyer_id = auth.uid()
   limit 1;

  if v_id is null then
    insert into public.conversations (listing_id, buyer_id, seller_id)
    values (p_listing_id, auth.uid(), v_seller)
    returning id into v_id;
  end if;
  return v_id;
end;
$$;
