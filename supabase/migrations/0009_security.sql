-- Sicherheits-Migration (Paket 1)
-- 1. Haushalte nur für Mitglieder sichtbar, Beitritt/Erstellung nur per RPC
-- 2. api_usage nicht mehr öffentlich
-- 3. Vorrat-Policies nur über Mitgliedschaft, mit WITH CHECK
-- 4. Altlast "household_id IS NULL" aus den Policies entfernt
-- 5. Bring/Cookidoo-Zugangsdaten aus user_metadata in eigene Tabelle
-- 6. Alle Einladungscodes neu erzeugt (alte waren für jeden lesbar)

begin;

-- ── Hilfsfunktionen ─────────────────────────────────────────────────────────
create or replace function public.is_household_member(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.household_members where household_id = hid and user_id = auth.uid())
$$;

create or replace function public.is_household_owner(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.household_members where household_id = hid and user_id = auth.uid() and role = 'owner')
$$;

create or replace function public.gen_invite_code()
returns text language sql volatile set search_path = public, extensions as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (get_byte(b, i) % 32) + 1, 1), '' order by i)
  from (select extensions.gen_random_bytes(8) as b) x, generate_series(0, 7) as i
$$;

-- ── Haushalt erstellen / beitreten (einzige Wege, Mitgliedschaften anzulegen) ──
create or replace function public.create_household(p_name text)
returns json language plpgsql security definer set search_path = public as $$
declare h public.households;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.households (name, invite_code, created_by)
    values (coalesce(nullif(trim(p_name), ''), 'Mein Haushalt'), public.gen_invite_code(), auth.uid())
    returning * into h;
  insert into public.household_members (household_id, user_id, role) values (h.id, auth.uid(), 'owner');
  return json_build_object('id', h.id, 'name', h.name, 'invite_code', h.invite_code, 'role', 'owner');
end $$;

create or replace function public.join_household(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare h public.households;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into h from public.households where invite_code = upper(replace(trim(p_code), '-', ''));
  if h.id is null then raise exception 'invalid_code'; end if;
  if exists (select 1 from public.household_members where household_id = h.id and user_id = auth.uid()) then
    raise exception 'already_member';
  end if;
  delete from public.household_members where user_id = auth.uid();
  insert into public.household_members (household_id, user_id, role) values (h.id, auth.uid(), 'member');
  return json_build_object('id', h.id, 'name', h.name);
end $$;

create or replace function public.regenerate_invite_code(hid uuid)
returns text language plpgsql security definer set search_path = public as $$
declare code text;
begin
  if not public.is_household_owner(hid) then raise exception 'forbidden'; end if;
  update public.households set invite_code = public.gen_invite_code() where id = hid returning invite_code into code;
  return code;
end $$;

revoke execute on function public.create_household(text), public.join_household(text),
  public.regenerate_invite_code(uuid), public.gen_invite_code() from public, anon;
grant execute on function public.create_household(text), public.join_household(text),
  public.regenerate_invite_code(uuid) to authenticated;

-- ── households ──────────────────────────────────────────────────────────────
drop policy if exists "Haushalt suchen"     on public.households;
drop policy if exists "Haushalt erstellen"  on public.households;
drop policy if exists "Haushalt umbenennen" on public.households;

create policy "Haushalt sehen" on public.households
  for select to authenticated using (public.is_household_member(id));

create policy "Haushalt umbenennen" on public.households
  for update to authenticated using (public.is_household_owner(id)) with check (public.is_household_owner(id));

revoke insert, update, delete on public.households from anon, authenticated;
grant update (name) on public.households to authenticated;

-- ── household_members ───────────────────────────────────────────────────────
drop policy if exists "Haushalt beitreten" on public.household_members;
revoke insert, update on public.household_members from anon, authenticated;

alter table public.household_members drop constraint if exists household_members_role_check;
alter table public.household_members add constraint household_members_role_check check (role in ('owner', 'member'));

-- ── api_usage: nur eigene Einträge schreiben, Lesen nur Service-Role ────────
drop policy if exists "Service role full access" on public.api_usage;
create policy "Eigene Nutzung protokollieren" on public.api_usage
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_household_member(household_id));

-- ── Vorrat ──────────────────────────────────────────────────────────────────
drop policy if exists "pantry_locations_household" on public.pantry_locations;
create policy "pantry_locations_household" on public.pantry_locations
  for all to authenticated
  using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

drop policy if exists "pantry_items_household" on public.pantry_items;
create policy "pantry_items_household" on public.pantry_items
  for all to authenticated
  using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

-- ── spices / shopping_items / storage_locations ohne "household_id IS NULL" ─
do $$
declare t text;
begin
  foreach t in array array['spices', 'shopping_items', 'storage_locations'] loop
    execute format('drop policy if exists "Haushalt lesen" on public.%I', t);
    execute format('drop policy if exists "Haushalt aktualisieren" on public.%I', t);
    execute format('drop policy if exists "Haushalt löschen" on public.%I', t);
    execute format('create policy "Haushalt lesen" on public.%I for select to authenticated using (public.is_household_member(household_id))', t);
    execute format('create policy "Haushalt aktualisieren" on public.%I for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id))', t);
    execute format('create policy "Haushalt löschen" on public.%I for delete to authenticated using (public.is_household_member(household_id))', t);
  end loop;
end $$;

-- ── Zugangsdaten für Bring!/Cookidoo (nicht mehr im JWT) ────────────────────
create table if not exists public.user_integrations (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  bring      jsonb,
  cookidoo   jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_integrations enable row level security;
drop policy if exists "Eigene Integrationen" on public.user_integrations;
create policy "Eigene Integrationen" on public.user_integrations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.user_integrations from anon;

insert into public.user_integrations (user_id, bring, cookidoo)
select id,
       nullif(raw_user_meta_data -> 'bring_settings', 'null'::jsonb),
       nullif(raw_user_meta_data -> 'cookidoo', 'null'::jsonb)
from auth.users
where raw_user_meta_data ? 'bring_settings' or raw_user_meta_data ? 'cookidoo'
on conflict (user_id) do update set bring = excluded.bring, cookidoo = excluded.cookidoo, updated_at = now();

update auth.users
set raw_user_meta_data = raw_user_meta_data - 'bring_settings' - 'cookidoo'
where raw_user_meta_data ? 'bring_settings' or raw_user_meta_data ? 'cookidoo';

-- ── Einladungscodes rotieren ────────────────────────────────────────────────
update public.households set invite_code = public.gen_invite_code();

commit;
