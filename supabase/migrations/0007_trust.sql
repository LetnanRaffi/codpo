-- Trust: reviews (PRD §36) + reputation materialized view (PRD §37).

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  unique (transaction_id, reviewer_id),
  constraint reviewer_not_self check (reviewer_id <> reviewee_id)
);

alter table public.reviews enable row level security;

create policy "reviews_select_public" on public.reviews for select using (true);

create policy "reviews_insert_participant_of_completed_tx"
  on public.reviews for insert
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and t.status = 'completed'
        and auth.uid() in (t.buyer_id, t.seller_id)
        and reviewee_id in (t.buyer_id, t.seller_id)
        and reviewee_id <> auth.uid()
    )
  );

-- Immutable: tidak ada policy update/delete.

create index reviews_reviewee_idx on public.reviews(reviewee_id);

-- Defense-in-depth: trigger validasi partisipasi & status transaksi.
create or replace function public.guard_review()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare v_trx public.transactions;
begin
  select * into v_trx from public.transactions where id = new.transaction_id;
  if v_trx.id is null then raise exception 'transaksi tidak ditemukan'; end if;
  if v_trx.status <> 'completed' then raise exception 'review hanya setelah transaksi selesai'; end if;
  if new.reviewer_id not in (v_trx.buyer_id, v_trx.seller_id) then
    raise exception 'kamu bukan pihak transaksi ini';
  end if;
  if new.reviewee_id not in (v_trx.buyer_id, v_trx.seller_id) then
    raise exception 'review harus untuk lawan transaksi';
  end if;
  return new;
end;
$$;

create trigger reviews_guard
  before insert on public.reviews
  for each row execute function public.guard_review();

-- Reputasi precomputed (PRD §37) — refresh otomatis via trigger.
create materialized view public.user_reputation as
select
  p.id as user_id,
  coalesce(round(r.avg_rating, 2), 0) as avg_rating,
  coalesce(r.review_count, 0) as review_count,
  coalesce(t.completed_total, 0) as completed_transactions,
  case when coalesce(t.finished_total, 0) > 0
       then round(coalesce(t.cancelled_total, 0)::numeric / t.finished_total * 100, 1)
       else 0 end as cancellation_rate_pct,
  coalesce(n.noshow_count, 0) as noshow_count
from public.profiles p
left join (
  select reviewee_id, avg(rating) as avg_rating, count(*) as review_count
  from public.reviews group by reviewee_id
) r on r.reviewee_id = p.id
left join (
  select seller_id as uid,
         count(*) filter (where status = 'completed') as completed_total,
         count(*) filter (where status in ('cancelled','no_show','disputed')) as cancelled_total,
         count(*) filter (where status in ('completed','cancelled','no_show','disputed')) as finished_total
  from public.transactions group by seller_id
) t on t.uid = p.id
left join (
  select buyer_id, count(*) as noshow_count
  from public.transactions where status = 'no_show' group by buyer_id
) n on n.buyer_id = p.id;

create unique index user_reputation_uid_idx on public.user_reputation(user_id);

grant select on public.user_reputation to anon, authenticated;

-- ponytail: refresh NON-concurrent supaya aman dipanggil dari trigger di dalam
-- transaksi apa pun (CONCURRENTLY dilarang di dalam tx). Ganti ke CONCURRENTLY
-- lewat cron tiap menit kalau ukuran data bikin refresh terasa.
create or replace function public.refresh_user_reputation()
returns void
language sql
security definer set search_path = ''
as $$
  refresh materialized view public.user_reputation;
$$;

revoke execute on function public.refresh_user_reputation() from anon, authenticated;

create or replace function public.refresh_reputation_trigger()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform public.refresh_user_reputation();
  return null;
end;
$$;

create trigger reviews_refresh_reputation
  after insert on public.reviews
  for each statement execute function public.refresh_reputation_trigger();

create trigger transactions_refresh_reputation
  after update of status on public.transactions
  for each statement execute function public.refresh_reputation_trigger();
