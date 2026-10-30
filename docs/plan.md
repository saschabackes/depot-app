# Plan

Geführt vom **Leitstand** (Regeln: [CLAUDE.md](../CLAUDE.md)). Die Entwicklung arbeitet nur Aufträge aus „Als Nächstes“
ab. Stand: 31.10.2026 – live v3.7.0.

## Jetzt

| Auftrag | Bereich | Sitzung | Stand |
|---|---|---|---|
| Alten iCloud-Ordner `…/Claude/Code/gewuerz-manager` löschen | Plattform | Leitstand | ab ~06.11. nach Saschas Okay |
| Gewürzmanager-Site: `main` steht seit 09.06. still (99 Commits hinter `haushalt-manager`). Klären, ob der Gewürzmanager die Neuerungen bekommen soll; wenn ja, `main` gezielt nachziehen und Site prüfen | Plattform | Leitstand | offen, Sascha entscheidet |





| Statistik „Entsorgt“ (siehe Auftrag unten) | Bestand | Entwicklung | in Arbeit, Branch `bestand/entsorgt-statistik` |

### Auftrag: Statistik „Entsorgt“

**Ziel:** Eine Seite, die die Frage „Was werfen wir weg, und warum?“ beantwortet – auf einen Blick, ohne Diagramm-
Bibliothek. Datenbasis sind die vorhandenen Felder `disposedAt`/`disposalReason` bei **Gewürzen** (`useStore.spices`)
und **Vorrat** (`usePantry.items`). Keine neue Tabelle, keine Migration.

**Umfang**

1. **Einstieg:** im Tab „Mehr“ (`src/components/MoreView.jsx`) eine Zeile „Was wir wegwerfen“ mit Untertitel
   „Entsorgtes nach Grund und Produkt“, zwischen „Verlauf“ und „Neuigkeiten“. Öffnet einen eigenen Screen.
2. **Zeitraum** oben als Segmented: „3 Monate“ (Standard), „12 Monate“, „Alles“.
3. **Kennzahlen** als Kacheln wie auf der Startseite: Entsorgt gesamt, davon Gewürze, davon Vorrat.
4. **Gründe:** Liste der `DISPOSAL_REASONS` (`src/ui/DisposeSheet.jsx`) mit Anzahl und Balken (Anteil, einfache
   `div`-Balken wie `AvailBar`), absteigend sortiert, Gründe ohne Einträge weglassen.
5. **Produkte:** die Namen, die am häufigsten entsorgt wurden (gleicher Name über Bereiche zusammengefasst, ohne
   Groß-/Kleinschreibung), mit Anzahl und Bereich, höchstens zehn. Zeile antippen → zum Eintrag im Bereich
   (wie die Startseiten-Suche navigiert).
6. **Ein Tipp** in einer Zeile unter den Kennzahlen, aus den Daten abgeleitet, z. B. „Am häufigsten: Abgelaufen –
   kleinere Packungen oder früher aufbrauchen?“, „Schimmel bei Vorrat – Lagerort prüfen?“. Nur ein Satz, nur wenn
   es mindestens drei Einträge gibt.
7. **Leer-Zustand:** „Noch nichts entsorgt – gut so.“ mit kurzem Hinweis, dass Entsorgen im Gewürz- und
   Vorrat-Detail erfasst wird.
8. **Demo-Daten:** je zwei, drei entsorgte Gewürze und Vorrat-Einträge mit verschiedenen Gründen und Daten
   (innerhalb und außerhalb von 3 Monaten), damit Zeitraum und Gründe sichtbar werden.

**Nicht im Umfang:** Tiefkühl und Wein (dort gibt es nur „verbraucht“, kein Entsorgen mit Grund), Startseite,
Export, Kosten/Geldwert, Diagramm-Bibliothek.

**Regeln:** Branch `bestand/entsorgt-statistik` von `origin/haushalt-manager` im eigenen Worktree. Gemeinsame
Dateien nur `MoreView.jsx` (eine Zeile) und ggf. `App.jsx` für die Navigation zum neuen Screen. Hell und Dunkel,
Handy-Breite, Demo-Modus mit echten Klicks (Zeitraum umschalten, Produkt antippen). Changelog-Text in die
PR-Beschreibung.

## Als Nächstes (Vorschläge, Sascha entscheidet)

| Idee | Bereich | Notiz |
|---|---|---|
| Push-Erinnerungen (Ablauf, Angebote) | Plattform | |
| Offline-Warteschlange für Änderungen | Plattform | |
| Fotos erst bei Bedarf laden | Plattform | Performance |
| Wein: „Tipp vom Experten“ (Schwiegervater) und Probierabend | Wein | Nr. 2 und 3 der Wein-Ideen |
| KI-Beschreibung für seltene Rebsorten (nur auf Knopfdruck) | Wein | |

## Erledigt

| Version | Inhalt |
|---|---|
| 3.7.0 | Schnell erfassen: „neu anlegen“ aus dem Suchfeld der Startseite, mit Vorschlag des Ziels |
| 3.6.1 | Zutaten mit Mengenbereich sauber auf der Liste; Rezeptdetail setzt nur noch, was nicht schon drauf steht |
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
