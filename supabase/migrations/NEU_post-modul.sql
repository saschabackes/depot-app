-- Post: Briefe und Rechnungen fotografieren, Zahlung und Erstattung (PKV) verfolgen.
-- Zwei unabhängige Spuren je Vorgang: Zahlung (pay_status) und Erstattung (reimb_status, nur Arztrechnung + PKV-Person).
-- Fotos liegen im privaten Bucket „post“, Pfad: <household_id>/<item_id>/<n>.jpg
begin;

-- ── Personen (auch ohne Login, z. B. Kinder) ────────────────────────────────
create table if not exists public.post_persons (
  id           text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  name         text not null,
  insurance    text not null default 'keine' check (insurance in ('pkv', 'gkv', 'keine')),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ── Vorgänge ────────────────────────────────────────────────────────────────
create table if not exists public.post_items (
  id                text primary key,
  household_id      uuid not null references public.households(id) on delete cascade,
  created_by        uuid default auth.uid(),
  kind              text check (kind in ('rechnung', 'arztrechnung', 'mahnung', 'info')),  -- null = noch nicht gesichtet
  reviewed          boolean not null default false,
  sender            text not null default '',
  title             text not null default '',
  note              text not null default '',
  person_id         text references public.post_persons(id) on delete set null,
  received_on       date not null default current_date,
  invoice_date      date,
  due_date          date,
  amount_cents      integer check (amount_cents is null or amount_cents >= 0),
  iban              text not null default '',
  reference         text not null default '',   -- Verwendungszweck
  related_id        text references public.post_items(id) on delete set null,  -- Mahnung → Ursprungsrechnung
  original_location text not null default '',   -- wo das Papier liegt
  -- Zahlung
  pay_status        text not null default 'offen' check (pay_status in ('offen', 'bezahlt', 'entfaellt')),
  paid_on           date,
  -- Erstattung (nur Arztrechnung + PKV-Person, sonst null)
  reimb_status      text check (reimb_status in ('einzureichen', 'eingereicht', 'erstattet', 'nicht_einreichen')),
  submitted_on      date,
  reimbursed_on     date,
  reimbursed_cents  integer check (reimbursed_cents is null or reimbursed_cents >= 0),
  archived_at       timestamptz,
  created_at        timestamptz not null default now()
);

-- ── Seiten (ein Foto je Seite) ──────────────────────────────────────────────
-- ocr_* und suggested sind für den späteren Raspi-Dienst vorgesehen und bleiben vorerst leer.
create table if not exists public.post_pages (
  id           text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  item_id      text not null references public.post_items(id) on delete cascade,
  path         text not null,
  sort_order   integer not null default 0,
  ocr_status   text not null default 'pending' check (ocr_status in ('pending', 'working', 'done', 'failed', 'skipped')),
  ocr_text     text,
  suggested    jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_post_persons_household on public.post_persons(household_id);
create index if not exists idx_post_items_household   on public.post_items(household_id);
create index if not exists idx_post_pages_item        on public.post_pages(item_id);
create index if not exists idx_post_pages_household   on public.post_pages(household_id);

-- ── Zeilen-Zugriff: nur Mitglieder des Haushalts ────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['post_persons', 'post_items', 'post_pages'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Haushalt lesen" on public.%I', t);
    execute format('drop policy if exists "Haushalt anlegen" on public.%I', t);
    execute format('drop policy if exists "Haushalt aktualisieren" on public.%I', t);
    execute format('drop policy if exists "Haushalt löschen" on public.%I', t);
    execute format('create policy "Haushalt lesen" on public.%I for select to authenticated using (public.is_household_member(household_id))', t);
    execute format('create policy "Haushalt anlegen" on public.%I for insert to authenticated with check (public.is_household_member(household_id))', t);
    execute format('create policy "Haushalt aktualisieren" on public.%I for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id))', t);
    execute format('create policy "Haushalt löschen" on public.%I for delete to authenticated using (public.is_household_member(household_id))', t);
  end loop;
end $$;

-- ── Datei-Zugriff: privater Bucket, erster Pfadteil ist die household_id ────
insert into storage.buckets (id, name, public) values ('post', 'post', false)
  on conflict (id) do nothing;

-- Textvergleich statt uuid-Umwandlung: ein Pfad in einem anderen Bucket darf die Auswertung nicht abbrechen
create or replace function public.is_household_member_text(hid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.household_members where household_id::text = hid and user_id = auth.uid())
$$;
revoke execute on function public.is_household_member_text(text) from public, anon;
grant execute on function public.is_household_member_text(text) to authenticated;

drop policy if exists "Post-Dateien lesen" on storage.objects;
drop policy if exists "Post-Dateien anlegen" on storage.objects;
drop policy if exists "Post-Dateien löschen" on storage.objects;
create policy "Post-Dateien lesen" on storage.objects for select to authenticated
  using (bucket_id = 'post' and public.is_household_member_text((storage.foldername(name))[1]));
create policy "Post-Dateien anlegen" on storage.objects for insert to authenticated
  with check (bucket_id = 'post' and public.is_household_member_text((storage.foldername(name))[1]));
create policy "Post-Dateien löschen" on storage.objects for delete to authenticated
  using (bucket_id = 'post' and public.is_household_member_text((storage.foldername(name))[1]));

commit;
