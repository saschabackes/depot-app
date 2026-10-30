# Plan

Geführt vom **Leitstand** (Regeln: [CLAUDE.md](../CLAUDE.md)). Die Entwicklung arbeitet nur Aufträge aus „Als Nächstes“
ab. Stand: 31.10.2026 – live v3.6.1.

## Jetzt

| Auftrag | Bereich | Sitzung | Stand |
|---|---|---|---|
| Alten iCloud-Ordner `…/Claude/Code/gewuerz-manager` löschen | Plattform | Leitstand | ab ~06.11. nach Saschas Okay |
| Gewürzmanager-Site: `main` steht seit 09.06. still (99 Commits hinter `haushalt-manager`). Klären, ob der Gewürzmanager die Neuerungen bekommen soll; wenn ja, `main` gezielt nachziehen und Site prüfen | Plattform | Leitstand | offen, Sascha entscheidet |




| Schnell erfassen (siehe Auftrag unten) | Bestand | Entwicklung | in Arbeit, Branch `bestand/schnell-erfassen` |

### Auftrag: Schnell erfassen

**Ziel:** Etwas Neues anlegen, ohne vorher den Bereich zu wählen. Ein Feld, Name tippen, Ziel antippen, fertig.
Kein neues Bedienelement: Das Suchfeld „Überall suchen“ auf der Startseite wird dafür erweitert.

**Umfang**

1. **Anlegen aus der Suche.** Sobald im Suchfeld der Startseite (`src/modules/dashboard/DashboardView.jsx`,
   `GlobalSearchResults`) ein Text steht, erscheint unter den Treffern (oder statt „Nichts gefunden“) ein Block
   „„<Text>“ neu anlegen“ mit einer Zeile je Ziel: Einkaufsliste, Gewürze, Tiefkühl, Wein, Vorrat. Nur Ziele, deren
   Bereich in dieser Variante aktiv ist (Gewürzmanager: Gewürze und Einkaufsliste).
2. **Reihenfolge mit Vorschlag.** Das wahrscheinlichste Ziel steht oben und ist als „Vorschlag“ markiert: Gibt es den
   Namen schon in einem Bereich, kommt dieser Bereich zuerst („schon 2× im Tiefkühl“). Sonst Wort-Heuristik mit dem,
   was schon da ist (`autoCategory` in Tiefkühl- und Vorrat-Store, Gewürz-Namen, Weinbegriffe wie Riesling/Spätburgunder/
   Jahrgang). Ohne Treffer: Einkaufsliste zuerst. Keine neue Datenhaltung, keine KI.
3. **Was beim Antippen passiert.** Einkaufsliste: sofort anlegen, Toast, Suchfeld leeren. Alle anderen Ziele: das
   bestehende Formular des Bereichs öffnen (`SpiceForm`, `FreezerForm`, `CellarForm`, `PantryForm`) mit vorbelegtem
   Namen, damit Lagerort, Foto, Kategorie wie gewohnt funktionieren. Nach „Sichern“ zurück zur Startseite, Suchfeld
   leer, Toast wie im Bereich. Formulare bekommen dafür höchstens eine Vorbelegung (`initialName`), sonst keine
   Änderung an ihnen.
4. **Demo-Modus:** mit „Basilikum“ (Gewürz vorhanden), „Pizza“ (neu), „Riesling“ (Wein) durchspielen.

**Nicht im Umfang:** Spracheingabe, Mengen-Parsing („3 Pizza“), eigener Tab oder eigenes Feld, Mehrfach-Erfassung
in einem Rutsch. Wer viel auf einmal einträgt, nutzt weiter die Formulare der Bereiche.

**Regeln:** Branch `bestand/schnell-erfassen` von `origin/haushalt-manager` im eigenen Worktree. Gemeinsame Dateien
nur Startseite und die vier Formulare (Vorbelegung). Keine Migration. Beide Varianten prüfen: Depot (`npm run dev`)
und Gewürzmanager (`VITE_ENABLE_MODULES` leer, Build), Demo-Modus hell und dunkel mit echten Klicks. Changelog-Text
in die PR-Beschreibung.

## Als Nächstes (Vorschläge, Sascha entscheidet)

| Idee | Bereich | Notiz |
|---|---|---|
| Push-Erinnerungen (Ablauf, Angebote) | Plattform | |
| Statistik „Entsorgt“ (was wegwerfen wir?) | Bestand | |
| Offline-Warteschlange für Änderungen | Plattform | |
| Fotos erst bei Bedarf laden | Plattform | Performance |
| Wein: „Tipp vom Experten“ (Schwiegervater) und Probierabend | Wein | Nr. 2 und 3 der Wein-Ideen |
| KI-Beschreibung für seltene Rebsorten (nur auf Knopfdruck) | Wein | |

## Erledigt

| Version | Inhalt |
|---|---|
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
