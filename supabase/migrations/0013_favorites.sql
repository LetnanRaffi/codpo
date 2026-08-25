create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;
create policy "favorites_owner_select" on public.favorites for select using (user_id = auth.uid());
create policy "favorites_owner_insert" on public.favorites for insert with check (user_id = auth.uid());
create policy "favorites_owner_delete" on public.favorites for delete using (user_id = auth.uid());
grant select, insert, delete on public.favorites to authenticated;
