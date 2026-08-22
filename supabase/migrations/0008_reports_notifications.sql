-- Reports (PRD §44) + Notifications in-app (PRD §42) dengan trigger events.

create type public.report_reason as enum (
  'scam','fake_item','misleading_listing','prohibited_item',
  'inappropriate_content','suspicious_user','price_manipulation'
);
create type public.report_status as enum ('open','reviewing','resolved','dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('listing','user','message')),
  target_id uuid not null,
  reason public.report_reason not null,
  description text check (char_length(description) <= 1000),
  status public.report_status not null default 'open',
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.reports enable row level security;

create policy "reports_select_own_or_admin"
  on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin());

create policy "reports_insert_authenticated"
  on public.reports for insert
  with check (
    reporter_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active')
  );

-- Status/resolusi hanya admin.
create policy "reports_update_admin"
  on public.reports for update
  using (public.is_admin()) with check (public.is_admin());

-- Reporter tidak bisa edit setelah submit; tidak bisa hapus (jejak moderasi).

create index reports_status_idx on public.reports(status, created_at desc);
create index reports_reporter_idx on public.reports(reporter_id);

-- ============ NOTIFICATIONS (PRD §42, in-app saja) ============
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'new_chat','cod_request','cod_accepted','cod_rejected','cod_countered',
    'cod_reminder','seller_otw','buyer_otw','arrived','transaction_completed',
    'rating_request','boost_activated'
  )),
  title text not null check (char_length(title) between 1 and 120),
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

-- Hanya tandai dibaca — sisanya immutable via guard.
create policy "notifications_update_read_own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.guard_notification_update()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (new.user_id, new.type, new.title, new.body, new.data, new.created_at)
     is distinct from (old.user_id, old.type, old.title, old.body, old.data, old.created_at) then
    raise exception 'notifikasi hanya bisa ditandai dibaca';
  end if;
  return new;
end;
$$;

create trigger notifications_guard_update
  before update on public.notifications
  for each row execute function public.guard_notification_update();

create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;

-- Helper insert notifikasi (dipanggil trigger lain).
create or replace function public.notify(
  p_user uuid, p_type text, p_title text, p_body text default null, p_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare v_status text;
begin
  select status into v_status from public.profiles where id = p_user;
  if v_status is distinct from 'active' then return; end if;
  insert into public.notifications (user_id, type, title, body, data)
  values (p_user, p_type, p_title, p_body, p_data);
end;
$$;

revoke execute on function public.notify(uuid,text,text,text,jsonb) from anon, authenticated;

-- ===== Trigger: pesan chat baru → lawan bicara =====
create or replace function public.on_message_notify()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare v_buyer uuid; v_seller uuid;
begin
  if new.type = 'system' or new.sender_id is null then return new; end if;
  select buyer_id, seller_id into v_buyer, v_seller
    from public.conversations where id = new.conversation_id;
  perform public.notify(
    case when new.sender_id = v_buyer then v_seller else v_buyer end,
    'new_chat', 'Pesan baru',
    left(new.body, 80),
    jsonb_build_object('conversation_id', new.conversation_id)
  );
  return new;
end;
$$;

create trigger messages_notify
  after insert on public.messages
  for each row execute function public.on_message_notify();

-- ===== Trigger: COD request & keputusannya =====
create or replace function public.on_cod_request_notify()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify(new.seller_id, 'cod_request', 'Ajukan COD baru',
      'Buyer mengajukan COD untuk listing kamu.',
      jsonb_build_object('request_id', new.id, 'listing_id', new.listing_id));
    return new;
  end if;

  if new.status = 'accepted' then
    perform public.notify(new.buyer_id, 'cod_accepted', 'COD diterima',
      'Seller menerima ajukan COD kamu.', jsonb_build_object('request_id', new.id));
  elsif new.status = 'rejected' then
    perform public.notify(new.buyer_id, 'cod_rejected', 'COD ditolak',
      'Seller menolak ajukan COD.', jsonb_build_object('request_id', new.id));
  elsif new.status = 'countered' then
    perform public.notify(new.buyer_id, 'cod_countered', 'Seller usul jadwal lain',
      coalesce(new.counter_meeting_point, ''),
      jsonb_build_object('request_id', new.id));
  end if;
  return new;
end;
$$;

create trigger codreq_notify
  after insert or update of status on public.cod_requests
  for each row execute function public.on_cod_request_notify();

-- ===== Trigger: perubahan state sesi → lawan =====
create or replace function public.on_cod_session_state_notify()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare v_other uuid; v_type text; v_title text;
begin
  v_other := case when auth.uid() = new.buyer_id then new.seller_id else new.buyer_id end;

  if new.state in ('otw','near_location') and new.last_state_actor is not null then
    v_type := case when new.last_state_actor = new.seller_id then 'seller_otw' else 'buyer_otw' end;
    v_title := 'Sedang OTW';
    perform public.notify(v_other, v_type, v_title, 'Lawan transaksi sedang OTW ke titik temu.',
      jsonb_build_object('session_id', new.id));
  elsif new.state = 'arrived' then
    perform public.notify(v_other, 'arrived', 'Sudah sampai lokasi',
      'Lawan transaksi sudah sampai di titik temu.', jsonb_build_object('session_id', new.id));
  elsif new.state = 'completed' then
    perform public.notify(new.buyer_id, 'rating_request', 'Kasih rating dong',
      'Transaksi selesai — rating kamu bantu seller lain.',
      jsonb_build_object('session_id', new.id, 'listing_id', new.listing_id));
    perform public.notify(new.seller_id, 'transaction_completed', 'Transaksi selesai',
      'Barang terjual via COD. Selesaikan dengan senyuman.',
      jsonb_build_object('session_id', new.id));
  end if;
  return new;
end;
$$;

create trigger codsessions_state_notify
  after update of state on public.cod_sessions
  for each row execute function public.on_cod_session_state_notify();
