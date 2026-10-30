-- Wochenplan: Rezepte auf Tage legen. Ein Tag ist einfach eine Liste von Rezepten.
begin;

-- recipe_id übernimmt den Typ von recipes.id (die Tabelle stammt aus dem Ursprungsschema, nicht aus den Migrationen)
do $$
declare id_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into id_type
  from pg_attribute a
  where a.attrelid = 'public.recipes'::regclass and a.attname = 'id' and not a.attisdropped;

  execute format($t$
    create table if not exists public.meal_plan (
      id            text primary key,
      household_id  uuid not null references public.households(id) on delete cascade,
      date          date not null,
      recipe_id     %s not null references public.recipes(id) on delete cascade,
      servings      integer check (servings is null or servings between 1 and 100),
      position      integer not null default 0,
      created_at    timestamptz not null default now()
    )
  $t$, id_type);
end $$;

create index if not exists idx_meal_plan_household_date on public.meal_plan(household_id, date);

alter table public.meal_plan enable row level security;
drop policy if exists "Haushalt lesen" on public.meal_plan;
drop policy if exists "Haushalt anlegen" on public.meal_plan;
drop policy if exists "Haushalt aktualisieren" on public.meal_plan;
drop policy if exists "Haushalt löschen" on public.meal_plan;
create policy "Haushalt lesen" on public.meal_plan for select to authenticated using (public.is_household_member(household_id));
create policy "Haushalt anlegen" on public.meal_plan for insert to authenticated with check (public.is_household_member(household_id));
create policy "Haushalt aktualisieren" on public.meal_plan for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "Haushalt löschen" on public.meal_plan for delete to authenticated using (public.is_household_member(household_id));

commit;
