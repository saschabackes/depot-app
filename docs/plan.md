# Plan

Geführt vom **Leitstand** (Regeln: [CLAUDE.md](../CLAUDE.md)). Die Entwicklung arbeitet nur Aufträge aus „Als Nächstes“
ab. Stand: 30.10.2026 – live v3.6.0.

## Jetzt

| Auftrag | Bereich | Sitzung | Stand |
|---|---|---|---|
| Alten iCloud-Ordner `…/Claude/Code/gewuerz-manager` löschen | Plattform | Leitstand | ab ~06.11. nach Saschas Okay |
| Gewürzmanager-Site: `main` steht seit 09.06. still (99 Commits hinter `haushalt-manager`). Klären, ob der Gewürzmanager die Neuerungen bekommen soll; wenn ja, `main` gezielt nachziehen und Site prüfen | Plattform | Leitstand | offen, Sascha entscheidet |



| Zwei Kleinigkeiten Kochen (siehe Auftrag unten) | Kochen | Entwicklung | in Arbeit, Branch `kochen/zutaten-liste` |

### Auftrag: Zwei Kleinigkeiten Kochen

**1. Zutaten-Namen mit Mengenbereich.** `cleanIngredientName` in `src/utils/recipeParser.js` entfernt nur eine Zahl am
Anfang. Aus „2-3 EL Butterschmalz“ wird deshalb „-3 EL Butterschmalz“ (Einkaufsliste, Rezeptdetail, Wochenansicht).
Bereiche wie „2-3“, „2 – 3“, „2 bis 3“, „1½-2“ sollen komplett wegfallen, inklusive der Einheit dahinter → „Butterschmalz“.
Mit ein paar Beispielen im Demo-Modus prüfen (Gulasch-Rezept hat so eine Zeile); normale Zeilen wie „600 g Rindergulasch“
dürfen sich nicht ändern.

**2. Rezeptdetail wie die Wochenansicht.** „Fehlende auf die Einkaufsliste“ im Rezeptdetail (`src/components/RecipeDetail.jsx`)
setzt Zutaten auch dann auf die Liste, wenn sie schon drauf stehen. Gleiche Regel wie in `src/components/WeekPlan.jsx`
(`toBuy`): offene Einträge der Einkaufsliste und Bring!-Einträge überspringen, Vergleich ohne Groß-/Kleinschreibung.
Steht schon alles drauf, Knopf durch den Hinweis „Alles Fehlende steht schon auf der Einkaufsliste.“ ersetzen. Am besten
die Logik an eine Stelle ziehen (kleine Hilfsfunktion), damit beide Ansichten dasselbe tun.

**Regeln:** Branch `kochen/zutaten-liste` von `origin/haushalt-manager` im eigenen Worktree. Keine Migration. Prüfen laut
Regel 6 mit echten Klicks. Changelog-Text in die PR-Beschreibung.

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
| 3.6.0 | Wochenplan (Kochen): Rezepte auf Tage legen, Einplanen im Rezept, Fehlendes der Woche auf die Liste, Startseite zeigt Geplantes |
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
