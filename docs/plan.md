# Plan

Geführt vom **Leitstand** (Regeln: [CLAUDE.md](../CLAUDE.md)). Die Entwicklung arbeitet nur Aufträge aus „Als Nächstes“
ab. Stand: 30.10.2026 – live v3.5.1.

## Jetzt

| Auftrag | Bereich | Sitzung | Stand |
|---|---|---|---|
| Alten iCloud-Ordner `…/Claude/Code/gewuerz-manager` löschen | Plattform | Leitstand | ab ~06.11. nach Saschas Okay |
| Gewürzmanager-Site: `main` steht seit 09.06. still (99 Commits hinter `haushalt-manager`). Klären, ob der Gewürzmanager die Neuerungen bekommen soll; wenn ja, `main` gezielt nachziehen und Site prüfen | Plattform | Leitstand | offen, Sascha entscheidet |


| Wochenplan (siehe Auftrag unten) | Kochen | Entwicklung | in Arbeit, Branch `kochen/wochenplan` |

### Auftrag: Wochenplan (Kochen)

**Ziel:** Rezepte auf Tage legen und die fehlenden Zutaten der geplanten Rezepte mit einem Tipp auf die Einkaufsliste
bringen. So einfach wie möglich: Tag antippen → Rezept wählen → fertig.

**Umfang**

1. **Daten:** neue Tabelle `meal_plan` (`household_id`, `date`, `recipe_id`, `servings` optional, `position`,
   `created_at`). RLS wie in 0009 (`is_household_member`), Migration als `supabase/migrations/NEU_meal-plan.sql`.
   Laden und CRUD im Store (`src/store/useStore.js`), Demo-Daten in `src/lib/demoSupabase.js` (zwei, drei geplante Tage).
2. **Ansicht „Woche“** im Bereich Kochen, umschaltbar neben „Rezepte“ (Segmented wie sonst in der App). Zeigt die
   nächsten 7 Tage ab heute, je Tag die geplanten Rezepte (Bild, Titel, Portionen). Tag antippen → Rezept aus der
   eigenen Sammlung wählen (Sheet mit Suche, Favoriten oben). Rezept in der Woche antippen → Rezeptdetail;
   wischen/„…“ → entfernen oder Portionen ändern; Kochmodus direkt startbar.
3. **Aus dem Rezeptdetail:** Knopf „Einplanen“ → Tag wählen (die nächsten 7 Tage).
4. **Einkauf:** Knopf „Fehlendes für die Woche auf die Einkaufsliste“ in der Wochenansicht. Nutzt den bestehenden
   Bestandsabgleich (`avail.missing` wie im Rezeptdetail) und den Portionsfaktor; gleiche Zutat über mehrere Rezepte
   nur einmal auf der Liste, nichts doppelt, was schon drauf ist. Toast wie beim Rezeptdetail.
5. **Startseite:** Abschnitt „Heute kochen“ zeigt zuerst, was für heute geplant ist; sonst wie bisher die Vorschläge.

**Nicht im Umfang:** Mahlzeiten-Slots (Frühstück/Mittag/Abend), automatische Wochenvorschläge, Push-Erinnerungen,
Wochen in der Vergangenheit. Ein Tag ist einfach eine Liste von Rezepten.

**Regeln:** Branch `kochen/wochenplan` von `origin/haushalt-manager` – **im eigenen Worktree**, nicht im gemeinsamen
Ordner. Gemeinsame Dateien, die der Auftrag erlaubt: `useStore.js`, `demoSupabase.js`, Startseite (`dashboard`).
Prüfen laut Regel 6; Klicks wirklich ausführen und das Ergebnis prüfen. Changelog-Text und „Nach dem Merge“
(Migration) in die PR-Beschreibung.

## Als Nächstes (Vorschläge, Sascha entscheidet)

| Idee | Bereich | Notiz |
|---|---|---|
| Push-Erinnerungen (Ablauf, Angebote) | Plattform | |
| Schnell erfassen (ein Feld für alle Bereiche) | Bestand | |
| Statistik „Entsorgt“ (was wegwerfen wir?) | Bestand | |
| Offline-Warteschlange für Änderungen | Plattform | |
| Fotos erst bei Bedarf laden | Plattform | Performance |
| Wein: „Tipp vom Experten“ (Schwiegervater) und Probierabend | Wein | Nr. 2 und 3 der Wein-Ideen |
| KI-Beschreibung für seltene Rebsorten (nur auf Knopfdruck) | Wein | |

## Erledigt

| Version | Inhalt |
|---|---|
| 3.5.1 | Einkaufsliste: Abhak-Kreis und Entfernen als eigene Tippflächen (kein Button im Button) |
| 3.5.0 | Angebots-Merkliste mit Ein-Klick-Prüfung (marktguru/kaufDA) |
| 3.4.1 | Lagerort als erste Kachel im Gewürz-Detail |
| 3.4.0 | Gewürz „Aufgebraucht“ mit optionalem Nachkauf |
| 3.3.1 | Turnstile-Captcha robust (Neu-Einhängen, Timeout, Retry) |
| 3.3.0 | Wein „Erklärt“ (Porträt, Trinktemperatur, Dekantieren, Glas, Glossar) |
| 3.2.0 | Portionsrechner und Kochmodus |
| 3.1.0 | Wein-Verwendung (Kochwein …), Emmi-Import, Einräumen automatisch erledigen |
| 3.0.0 | Redesign „Modernisiert“ |
| 2.9.x | Sicherheits- und Fehlerpakete aus dem Review |
