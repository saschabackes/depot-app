-- Angebots-Merkliste: Produkte, die wir günstig kaufen wollen
begin;

create table if not exists public.price_watch (
  id            text primary key,
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  search_term   text not null default '',
  target_price  numeric(8,2) check (target_price is null or target_price >= 0),
  offer_price   numeric(8,2) check (offer_price is null or offer_price >= 0),
  offer_store   text not null default '',
  offer_until   date,
  best_price    numeric(8,2) check (best_price is null or best_price >= 0),
  best_store    text not null default '',
  checked_at    timestamptz,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_price_watch_household on public.price_watch(household_id);

alter table public.price_watch enable row level security;
drop policy if exists "Haushalt lesen" on public.price_watch;
drop policy if exists "Haushalt anlegen" on public.price_watch;
drop policy if exists "Haushalt aktualisieren" on public.price_watch;
drop policy if exists "Haushalt löschen" on public.price_watch;
create policy "Haushalt lesen" on public.price_watch for select to authenticated using (public.is_household_member(household_id));
create policy "Haushalt anlegen" on public.price_watch for insert to authenticated with check (public.is_household_member(household_id));
create policy "Haushalt aktualisieren" on public.price_watch for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "Haushalt löschen" on public.price_watch for delete to authenticated using (public.is_household_member(household_id));

commit;
