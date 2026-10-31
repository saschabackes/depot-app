# Plan

Geführt vom **Leitstand** (Regeln: [CLAUDE.md](../CLAUDE.md)). Die Entwicklung arbeitet nur Aufträge aus „Als Nächstes“
ab. Stand: 31.10.2026 – live v3.8.1.

## Jetzt

| Auftrag | Bereich | Sitzung | Stand |
|---|---|---|---|
| Alten iCloud-Ordner `…/Claude/Code/gewuerz-manager` löschen | Plattform | Leitstand | ab ~06.11. nach Saschas Okay |
| Gewürzmanager-Site baut aus dem separaten Repo `gewuerz-manager` (Stand 14.06.). Klären, ob der Gewürzmanager die Neuerungen bekommen soll; wenn ja, Site auf `depot-app`/`main` umhängen (ohne `VITE_ENABLE_MODULES`, Gewürzmanager-Domain in `ALLOWED_ORIGINS` der Functions) | Plattform | Leitstand | offen, Sascha entscheidet |






| Branch-Schutz für `haushalt-manager`/`main` (nur per PR), gemergte Feature-Branches auf GitHub löschen | Plattform | Leitstand nach Saschas Okay | offen |

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
| – | `main` per Fast-Forward auf `haushalt-manager` gebracht (31.10.), README nennt den Produktionsbranch |
| – | Netlify: automatische Git-Builds der Depot-Site abgeschaltet, Deploy nur noch per CLI (31.10.) |
| 3.8.1 | Prüfung: Bring!-Kennungen nur als UUID, 3-MB-Limit im Rezept-Import, Baseline-Migration 0014, Prüfbericht |
| 3.8.0 | „Was wir wegwerfen“ im Tab Mehr: Entsorgtes nach Grund und Produkt, Zeitraum, Tipp |
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
