-- Baseline für Tabellen, die der Code nutzt, aber keine Migration im Repo anlegt:
-- recipes, activity_log, pending_inventory, spice_categories sowie spices.category/fill_level/form.
--
-- AUS CODE REKONSTRUIERT – GEGEN LIVE-STAND ABGLEICHEN.
-- Quelle je Spalte: src/store/useStore.js (recipeToDB/recipeToJS, _logActivity/loadActivity,
-- _addPending/markPurchased/_pendingToJS, addCategory/catToJS, spiceToDB/toJS). Nur belegte Spalten;
-- Typen und Defaults, die der Code nicht eindeutig hergibt, sind als UNSICHER kommentiert.
--
-- Idempotent und auf einer Datenbank, in der die Tabellen schon existieren, ein No-op:
-- `create table if not exists`, `add column if not exists`, Policies nur, wenn die Tabelle noch keine hat.
-- Lesende Live-Prüfung (31.10.2026) ergab: alle vier Tabellen vorhanden, RLS aktiv, je eine FOR-ALL-Policy
-- „Haushalt sieht eigene …“ mit Unterabfrage auf household_members. Die hier erzeugten Policies greifen
-- daher live nicht, nur in einem neu aufgesetzten Projekt.

begin;

-- ── spice_categories ─────────────────────────────────────────────────────────
-- Code: insert { id (Client-UUID), name, color ('gray' Default), sort_order, household_id }; select order by sort_order, name
create table if not exists public.spice_categories (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  color         text not null default 'gray',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ── spices: Spalten, die der Code nutzt, aber 0001–0013 nicht anlegen ─────────
-- category: Code vergleicht sp.category === <Kategorie-ID> und setzt null beim Löschen der Kategorie.
--   UNSICHER: Typ text (ID als Text) statt uuid-FK – aus dem Code nicht eindeutig; kein FK, damit keine
--   Live-Daten verletzt werden. Live-Prüfung: text, ohne FK.
-- fill_level: Code liest fillLevel ?? 4 (0–4). form: Freitext (ganz/gemahlen …).
alter table public.spices add column if not exists category   text;
alter table public.spices add column if not exists fill_level integer not null default 4;
alter table public.spices add column if not exists form       text;

-- ── pending_inventory (Nachkauf-/Einräumen-Warteschlange für Gewürze) ─────────
-- Code: insert { id (Client-UUID), household_id, name, brand, spice_id, status 'shopping'|'ready', seen_on_list }
--       update status / seen_on_list; delete by id oder household_id + ilike(name); order by created_at
create table if not exists public.pending_inventory (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  brand         text,
  spice_id      uuid,                                   -- UNSICHER: kein FK im Code belegt (Gewürz kann gelöscht sein)
  status        text not null default 'shopping' check (status in ('shopping', 'ready')),
  seen_on_list  boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── recipes ──────────────────────────────────────────────────────────────────
-- Code (recipeToDB): title, source_url, source_type ('youtube' Default), video_id, thumbnail_url, author,
--   tags [], favorite false, ingredients [], steps [], notes, servings; insert ergänzt id (Client-UUID),
--   household_id, created_by. favorite kommt in 0005, servings in 0011 per add column (beide if not exists).
create table if not exists public.recipes (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  created_by    uuid references auth.users(id) on delete set null,
  title         text not null,
  source_url    text,
  source_type   text default 'youtube',
  video_id      text,
  thumbnail_url text,
  author        text,
  tags          text[] default '{}',
  favorite      boolean default false,
  ingredients   jsonb default '[]'::jsonb,            -- [{ name, amount }]
  steps         jsonb default '[]'::jsonb,            -- [text]
  notes         text,
  servings      integer check (servings is null or servings between 1 and 100),
  created_at    timestamptz not null default now()
);

-- ── activity_log (Verlauf „Wer hat was geändert“) ────────────────────────────
-- Code: insert { household_id, user_id, user_name, action, target_name, detail } (id/created_at per Default);
--       select order by created_at desc limit 150
create table if not exists public.activity_log (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  user_name     text,
  action        text not null,
  target_name   text,
  detail        text,
  created_at    timestamptz not null default now()
);

-- ── Indizes (Zugriff immer per household_id) ─────────────────────────────────
create index if not exists idx_spice_categories_household on public.spice_categories(household_id);
create index if not exists idx_pending_inventory_household on public.pending_inventory(household_id);
create index if not exists idx_recipes_household on public.recipes(household_id);
create index if not exists idx_activity_log_household_created on public.activity_log(household_id, created_at desc);

-- ── RLS: nur Haushaltsmitglieder, Muster wie 0009/0012/0013 ──────────────────
-- Policies nur anlegen, wenn die Tabelle noch keine hat (live existieren gleichwertige unter anderen Namen).
do $$
declare t text;
begin
  foreach t in array array['spice_categories', 'pending_inventory', 'recipes', 'activity_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t) then
      execute format('create policy "Haushalt lesen" on public.%I for select to authenticated using (public.is_household_member(household_id))', t);
      execute format('create policy "Haushalt anlegen" on public.%I for insert to authenticated with check (public.is_household_member(household_id))', t);
      execute format('create policy "Haushalt aktualisieren" on public.%I for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id))', t);
      execute format('create policy "Haushalt löschen" on public.%I for delete to authenticated using (public.is_household_member(household_id))', t);
    end if;
  end loop;
end $$;

commit;
