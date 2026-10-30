# Depot – Regeln für alle Claude-Sitzungen

Depot (Haushalts-PWA: Gewürze, Tiefkühl, Wein, Vorrat, Kochen, Einkauf) ist Saschas App für den eigenen Haushalt.
Aus demselben Code entsteht zusätzlich der **Gewürzmanager** (nur Gewürze). Sprache mit Sascha, in der App und in der
Doku: **Deutsch**. Leitziel: einfach und selbsterklärend – jede Änderung macht die App eher leichter als schwerer.

Repo: `~/Code/depot` (nicht mehr in iCloud) · GitHub `saschabackes/depot-app` (**öffentlich**) · Betrieb:
[docs/betrieb.md](docs/betrieb.md) · Plan: [docs/plan.md](docs/plan.md)

## Rollen

| Rolle | Sitzung | Aufgabe |
|---|---|---|
| **Leitstand** | „Depot – Leitstand“ | Gespräch mit Sascha, Plan (`docs/plan.md`), Aufträge zuschneiden, PRs prüfen und mergen, **Version/Changelog/Migrationsnummer vergeben, Migrationen einspielen, deployen** |
| **Entwicklung** | „Depot – Entwicklung“ | Umsetzung der Aufträge aus dem Plan, alle Bereiche |
| **Prüfung** | auf Auftrag | Sicherheits-, Code- und Usability-Review vor größeren Releases bzw. monatlich |
| **Recherche** | auf Auftrag | Andere Apps/Quellen auf Ideen prüfen; Bericht in `docs/recherche/`, kein Code |

Standard ist **eine** Entwicklungs-Sitzung. Eine zweite nur für einen klar begrenzten Auftrag des Leitstands, der keine
Dateien der ersten berührt.

## Regeln für Entwicklungs-Sitzungen

1. **Nur Aufträge aus `docs/plan.md`** (oder ausdrücklich von Sascha). Eigene Ideen als Vorschlag an den Leitstand.
2. **Eigener Branch**, Name `<bereich>/<kurz>` (z. B. `einkauf/angebote-push`, `wein/probierabend`). Vor Beginn
   `git fetch` und vom aktuellen `origin/haushalt-manager` abzweigen (Produktionsstand von Depot; `main` gehört zum Gewürzmanager und wird nicht angefasst).
3. **Niemals direkt auf `haushalt-manager` pushen.** Ergebnis immer als **Pull Request** gegen `haushalt-manager`.
4. **Nicht selbst vergeben oder ändern:** `src/changelog.js` (Version leitet sich daraus ab), Nummern neuer Migrationen.
   Neue Migration als `supabase/migrations/NEU_<name>.sql` (mit `begin; … commit;`). Changelog-Text gehört in die
   **PR-Beschreibung** (Abschnitt „Changelog“).
5. **Nicht deployen, keine Migrationen einspielen, keine Produktionsdaten ändern.** Nötige Schritte in der
   PR-Beschreibung unter „Nach dem Merge“ auflisten.
6. **Vor dem PR:** `npm run build` grün; Änderung im **Demo-Modus** (`http://localhost:5173/?demo`, Handy-Breite)
   durchgeklickt, keine neuen Fehler in der Konsole; betroffene Ansichten in Hell und Dunkel angesehen.
7. **Fertig melden** an den Leitstand (SendMessage) mit PR-Link und „Nach dem Merge“.
8. **Gemeinsame Dateien** (`src/ui/*`, `src/store/useStore.js`, `src/App.jsx`, `src/lib/sync.js`, `netlify/functions/*`,
   `tailwind.config.js`) nur, wenn der Auftrag es verlangt – größere Umbauten vorher beim Leitstand anmelden.

## Regeln für den Leitstand

- Plan führen: Aufträge in `docs/plan.md` mit Bereich, Stand; Erledigtes nach „Erledigt“ mit Version.
- Je PR: auf aktuelles `haushalt-manager` bringen, Regel 6 selbst prüfen, kurzer Code-Review, dann Version + Changelog
  in `src/changelog.js`, Migrationsnummer vergeben (`NEU_…` → `00NN_…`), mergen.
- **Sammeln, dann deployen:** Änderungen werden gebündelt. Deploy **nur nach Saschas „deploy“** (Ablauf in
  docs/betrieb.md), danach Live-Version prüfen. Migrationen erst als Probelauf (`rollback`), dann echt – nur additive
  Migrationen ohne Rückfrage, alles mit Datenverlust-Risiko nur nach Saschas Freigabe.
- Es deployt immer nur eine Sitzung – der Leitstand.

## Für alle

- **Öffentliches Repo:** keine Personendaten, E-Mail-Adressen, Schlüssel oder `.env`-Inhalte in Code, Commits, Issues oder Doku.
- **Keine Anmeldungen** im Namen von Sascha (Supabase-Dashboard, Bring!, Cookidoo …), keine Passwörter eingeben, nicht
  im Schlüsselbund nach Zugangsdaten suchen. Getestet wird im Demo-Modus.
- **Usability mitprüfen:** bei jeder Änderung fragen, ob es einfacher geht; Texte kurz und ohne Fachbegriffe.
- **Konsistenz:** Änderungen an Mustern (Listen, Sheets, Rückfragen) für alle Bereiche nachziehen, nicht nur für einen.
- Bring!/Cookidoo/Prospekt-Portale: nur offizielle bzw. öffentlich vorgesehene Wege; kein Scraping inoffizieller Schnittstellen.
- Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
