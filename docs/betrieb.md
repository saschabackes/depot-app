# Betrieb

Wie Depot läuft: Aufbau, lokale Entwicklung, Deploy, Migrationen. Stand: 31.10.2026 (v3.8.0 live).

## Aufbau

| Teil | Technik |
|---|---|
| Frontend | React 18 + Vite, Tailwind 3, Zustand, PWA (vite-plugin-pwa/Workbox) |
| Daten | Supabase (Postgres + RLS + Auth), Projekt-Ref `naqjlaycjtobpsrjaqoq` |
| Server-Funktionen | Netlify Functions (`netlify/functions/*`, CommonJS): Bring!, Cookidoo, Rezept-Import (`recipe-meta`), Captcha |
| Hosting | Netlify, zwei Sites aus demselben Code (siehe unten) |
| Login-Schutz | Cloudflare Turnstile; Supabase prüft das Token |

**Zwei Varianten:** `VITE_ENABLE_MODULES=1` → **Depot** (alle Bereiche); ohne → **Gewürzmanager** (nur Gewürze).
Lokal (`npm run dev`) ist immer Depot aktiv.

## Lokal entwickeln

- `npm run dev` → `http://localhost:5173`. **Demo-Modus:** `http://localhost:5173/?demo` ersetzt Supabase durch eine
  Datenbank im Arbeitsspeicher (`src/lib/demoSupabase.js`) – ohne Login, ohne echte Daten. Neue Tabellen dort mit
  Beispieldaten ergänzen.
- `netlify dev` (Port 8888, `.claude/launch.json`) startet zusätzlich die Functions.
- Turnstile lädt lokal erst beim Antippen des Login-Formulars (schont die Cloudflare-Statistik).

## Deploy (nur Leitstand, nur nach Saschas „deploy“)

Produktionsstand von **Depot** ist der Branch **`haushalt-manager`**. `main` gehört zur **Gewürzmanager**-Site und steht seit 09.06.2026 still – nicht versehentlich dorthin pushen (siehe Plan).

Immer aus einem **eigenen Worktree** deployen, nie aus dem gemeinsamen Ordner `~/Code/depot`: Dort arbeitet die
Entwicklungs-Sitzung und wechselt Branches – `netlify deploy --build` baut sonst den falschen Stand (passiert am 30.10.).

```
git push origin haushalt-manager
git worktree add --detach /tmp/depot-deploy origin/haushalt-manager
cp .env /tmp/depot-deploy/ && ln -s ~/Code/depot/node_modules /tmp/depot-deploy/node_modules
cd /tmp/depot-deploy
NETLIFY_SITE_ID=aac4e06e-ac62-4394-8037-1c4aeb4edc12 npx netlify deploy --build --prod --site=aac4e06e-ac62-4394-8037-1c4aeb4edc12
cd ~/Code/depot && git worktree remove --force /tmp/depot-deploy
```

**Falle Site-ID:** Ohne beide Angaben deployt die Netlify-CLI auf die **Gewürzmanager**-Site. Für Depot immer
`aac4e06e-…` setzen. Danach prüfen: Versionsnummer im Live-Bundle suchen; „Neue Version verfügbar“ erscheint in der App.

## Migrationen (nur Leitstand)

Dateien in `supabase/migrations/`, fortlaufend nummeriert (`0012_price-watch.sql`). Entwicklungs-Sitzungen legen
`NEU_<name>.sql` an, der Leitstand nummeriert beim Merge. `supabase db push` wird nicht benutzt.

1. Probelauf: Kopie der Datei mit `rollback;` statt `commit;` in den Scratchpad legen und ausführen.
2. Echt: `supabase db query --linked --project-ref naqjlaycjtobpsrjaqoq -f <datei>.sql`
3. Prüfen (Tabelle/Spalte/Policies vorhanden).

Die Befehle **aus einem Ordner ohne `supabase/`-Unterordner** starten (z. B. Scratchpad), sonst greift die CLI auf die
lokale Konfiguration zu. Neue Tabellen: RLS an, Policies mit `public.is_household_member(household_id)` (siehe 0009).

## Sicherheit

- RLS auf allen Haushaltstabellen (nur Mitglieder), Haushalt anlegen/beitreten nur über RPCs.
- Zugangsdaten für Bring!/Cookidoo in `user_integrations` (nur eigene Zeilen).
- Functions prüfen das Supabase-JWT; Rezept-Import nur für Hosts auf der Allowlist (SSRF-Schutz).
- `.env` enthält Schlüssel und wird **nie** committet. Repo ist öffentlich.
