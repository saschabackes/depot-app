# Prüfung 31.10.2026 – Umsetzung der hohen Befunde aus dem Review

Grundlage: Review-Berichte vom 30.10. (Stand `einkauf/abhak-kreis`) und 31.10. (Stand `origin/main`).
Geprüft am Code von `origin/haushalt-manager` (Produktionsstand, v3.8.0). Nichts committet, nichts gepusht,
nichts in die Live-Datenbank eingespielt (nur lesende Abfragen und ein `rollback`-Probelauf).

## Schritt 0 – P-017: Stand von `main` (nur geprüft)

Belegt mit `git`:

| Frage | Befund |
|---|---|
| `origin/main` | `bf6ded1` (09.06.2026), Default-Branch des Repos (`origin/HEAD` → `main`) |
| Verhältnis zu `haushalt-manager` | reiner Vorfahre: 128 Commits dahinter, 0 davor – Fast-Forward möglich, kein Konflikt |
| Sicherheits-Commits `48a3b9c`, `5d850c2` | in allen sechs Nicht-`main`-Branches enthalten, auch in `haushalt-manager` |
| Feature-Branches (`einkauf/abhak-kreis`, `kochen/wochenplan`, `kochen/zutaten-liste`, `bestand/schnell-erfassen`, `bestand/entsorgt-statistik`) | alle vollständig in `haushalt-manager` gemergt (0 Commits voraus); nur noch Branch-Reste auf GitHub |
| Tags | keine |
| `netlify.toml` | kein `[context]`, kein Branch festgelegt |

Abhängigkeiten: `main` ⊂ alle Feature-Branches ⊂ `haushalt-manager`. Die Korrekturen liegen damit in
`haushalt-manager`, dem einzigen Branch, der nach `main` darf. Die Feature-Branches brauchen nicht
gemergt zu werden, sie sind Teilmengen.

Wie Depot deployt wird, ist bekannt: per Netlify-CLI aus einem Worktree des Branches `haushalt-manager`
auf die Site `aac4e06e-…` (docs/betrieb.md). Unbekannt ist, ob die **Gewürzmanager-Site** per
Git-Integration von `main` baut – dann liefe dort heute der ungehärtete Juni-Stand.

**Checkliste für Sascha (vor jedem Push nach `main`):**

1. Netlify → Gewürzmanager-Site → *Site configuration → Build & deploy → Continuous deployment*:
   Ist ein Repository verknüpft? Welcher *Production branch*? Welche *Build command* / *Publish directory*?
2. Dort unter *Environment variables*: `VITE_ENABLE_MODULES` darf **nicht** gesetzt sein (sonst wird aus
   demselben Code Depot statt Gewürzmanager), `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` und die
   Function-Secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPER_ADMIN_EMAIL`,
   `BRING_API_KEY`, `SERP_API_KEY`, optional `GOOGLE_API_KEY`) müssen vorhanden sein, falls die Site die
   Functions braucht.
3. Dasselbe für die Depot-Site: Ist dort *kein* Repository verknüpft (nur CLI-Deploy), ist ein Push nach
   `main` folgenlos für Depot. Ist eines verknüpft, den Production branch auf `haushalt-manager` prüfen.
4. Entscheidung, ob der Gewürzmanager die Neuerungen bekommen soll (offener Plan-Punkt). Die Functions auf
   `haushalt-manager` erlauben nur die Depot-Origins (`depotapp.online`, `depotapp.netlify.app`); die
   Gewürzmanager-Domain müsste in `ALLOWED_ORIGINS` aller Functions ergänzt werden, sonst schlagen
   Bring!/Cookidoo/Import dort fehl.
5. Erst danach, lokal verifiziert und ohne Branchwechsel im gemeinsamen Checkout:
   `git push origin haushalt-manager:main` (Fast-Forward, kein Merge-Commit nötig).
6. Danach: Branch-Protection für `main` (nur PR), die fünf gemergten Feature-Branches auf GitHub löschen,
   Tag je Version (`v3.8.0`), README-Satz „Produktion: Branch `haushalt-manager`, Deploy per CLI“.

## P-018 – Netlify-Functions (am Stand `haushalt-manager` geprüft)

Bereits vorhanden (Commits `48a3b9c`/`5d850c2`): `verifyJwt` (Supabase `/auth/v1/user`) in `bring-proxy`,
`cookidoo-fetch`, `recipe-meta`, `analyze-label`, `feedback`, `user-admin`; Origin-Allowlist statt `*` in allen
Functions; `cookidoo-fetch` mit fester Host-Allowlist (`COOKIDOO_TLDS` + Vorwerk-Domains, auch bei jeder
Weiterleitung); `recipe-meta` nur `https`, Host-Allowlist, Weiterleitungen gegen die Allowlist, kein
Nutzername/Passwort/Port in der URL. SerpAPI-Suche läuft hinter der JWT-Prüfung. Die Befunde aus dem
Bericht treffen auf `main` zu, nicht auf den Produktionsstand.

Ergänzt (zwei kleine Lücken aus dem Auftrag):

- `netlify/functions/bring-proxy.js`: `listUuid`, `userUuid`, `rawUuid` müssen UUIDs sein, sonst 400.
- `netlify/functions/recipe-meta.js`: Antworten fremder Seiten werden nur bis 3 MB gelesen (Content-Length
  und Stream), darüber Abbruch; gilt für YouTube-Seiten und Rezeptseiten.

Getestet ohne Netz (gefaktes `fetch`): ohne Token 401; `listUuid = ../../evil` → 400; echte UUID geht durch;
5-MB-Antwort → leeres Ergebnis statt Verarbeitung; kleine Seite mit JSON-LD → Rezept gelesen.

Nicht angefasst, obwohl im Umfeld: `shelly-proxy.js` ohne Auth (P-003, mittel), Kosten-Bremse (P-004), CSP
(P-005) – nicht Teil des Auftrags.

## P-002 – households-Policies

Existiert bereits als `supabase/migrations/0009_security.sql` (eingespielt am 02.10.): `households` nur für
Mitglieder lesbar (`is_household_member`), Beitritt und Erstellung nur über `join_household` /
`create_household` (`security definer`, `set search_path = public`), Einladungscodes rotiert. Keine neue
Migration nötig.

Lesende Live-Prüfung (31.10.) bestätigt: Policies „Haushalt sehen“ (select, Mitglied) und „Haushalt
umbenennen“ (update, Owner) sind aktiv, RLS an, RPCs vorhanden. Einziger Schönheitsfehler: `anon` hat noch
ein `SELECT`-Grant auf `households` (durch RLS ohne Policy für `anon` wirkungslos). Optional per
`revoke select on public.households from anon;` bereinigen.

## P-001 – fehlende Tabellen

Neu: `supabase/migrations/0014_baseline-code-tabellen.sql` – aus `src/store/useStore.js` rekonstruiert,
im Kopf als solche markiert, Unsicheres kommentiert. Legt `spice_categories`, `pending_inventory`,
`recipes`, `activity_log` und die Spalten `spices.category/fill_level/form` nur an, wenn sie fehlen;
Policies nur, wenn eine Tabelle noch keine hat. Auf der Live-Datenbank ist sie ein No-op
(`rollback`-Probelauf fehlerfrei).

Lesende Live-Prüfung ergab: Alle vier Tabellen existieren mit RLS; je eine `FOR ALL`-Policy
„Haushalt sieht eigene …“ auf Basis `household_id in (select … from household_members where user_id =
auth.uid())`. Spalten decken sich mit der Rekonstruktion (recipes zusätzlich: nichts; spices: identisch).
Nicht vorhanden – weder im Repo noch live: die RPC `count_active_users`, die `user-admin.js` (Zeile 232/236)
aufruft; der Aufruf läuft dort offenbar in einen Fallback. Nicht Teil des Auftrags, nur notiert.

## Prüfen des Live-Stands (für Sascha, nur lesend)

Aus einem Ordner ohne `supabase/`-Unterordner:

```
supabase db query --linked --project-ref naqjlaycjtobpsrjaqoq -f live-check.sql
```

mit `live-check.sql`:

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public'
  and tablename in ('households','household_members','recipes','activity_log','pending_inventory','spice_categories')
order by 1, 2;
select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('households','recipes','activity_log','pending_inventory','spice_categories');
select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('join_household','create_household','is_household_member','count_active_users');
```

Erwartung: `households` nur „Haushalt sehen“/„Haushalt umbenennen“, RLS überall `true`, die drei
Haushalts-RPCs vorhanden, `count_active_users` fehlt.

## Build und Tests

`npm run build` grün in beiden Varianten (Depot mit `VITE_ENABLE_MODULES=1`, Gewürzmanager ohne), aus dem
Prüf-Worktree mit verlinktem `node_modules` des gemeinsamen Checkouts – kein `npm install` nötig.
Das Repo hat keine Tests und kein `test`-Script; die Function-Änderungen wurden mit einem kleinen
Node-Script ohne Netz geprüft (siehe oben).

## Ausdrücklich nicht angefasst

Alle mittleren und niedrigen Befunde: P-003 (shelly-proxy), P-004 (Kosten-Bremse), P-005 (CSP/HSTS),
P-006 (npm audit), P-007 (Backup), P-008 (Cookidoo-Passwort in `user_integrations`), P-009 (Haushalt
verlassen), P-010, P-011, P-012, P-013, P-014, P-015 (bis auf die UUID-Prüfung, die der Auftrag verlangt),
P-016, P-019. Ebenso `docs/plan.md` und CLAUDE.md.
