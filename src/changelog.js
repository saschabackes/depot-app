// ── Changelog ────────────────────────────────────────────────────────────────
// Neueste Version immer OBEN eintragen — APP_VERSION leitet sich daraus ab.
// types: 'new' (Neu), 'improved' (Verbessert), 'fixed' (Behoben)

export const CHANGELOG = [
  {
    version: '2.9.1',
    date: '2026-10-02',
    entries: [
      { type: 'fixed',    text: 'QR-Etiketten öffnen beim Scannen jetzt direkt den passenden Vorrat.' },
      { type: 'fixed',    text: 'Fehlgeschlagene Speichervorgänge werden angezeigt und der echte Stand neu geladen – nichts geht mehr unbemerkt verloren.' },
      { type: 'fixed',    text: 'Beim Abmelden oder Haushaltswechsel werden TK, Wein und Vorrat vollständig geleert.' },
      { type: 'fixed',    text: 'Datumsangaben nach Mitternacht landen nicht mehr auf dem Vortag.' },
      { type: 'fixed',    text: 'Barcode-Scanner kann die App beim schnellen Schließen nicht mehr abstürzen lassen; die Kamera wird zuverlässig freigegeben.' },
      { type: 'fixed',    text: 'Rezept-Vorschläge auf der Startseite öffnen direkt das Rezept.' },
      { type: 'improved', text: 'Zurück-Geste bzw. -Taste wechselt zum vorherigen Bereich, statt die App zu schließen.' },
      { type: 'improved', text: 'Deutlich weniger Neuladen im Hintergrund – spart Datenvolumen und verhindert kurzes Flackern.' },
      { type: 'improved', text: 'Bei Verbindungsproblemen bleibt der zuletzt geladene Stand sichtbar, statt leerer Listen.' },
    ],
  },
  {
    version: '2.9.0',
    date: '2026-10-02',
    entries: [
      { type: 'new',      text: 'Vorrat: neues Modul für die Vorratskammer mit Lagerorten, MHD und QR-Etiketten zum Ausdrucken.' },
      { type: 'new',      text: 'Entsorgen mit Grund (z. B. Schädlingsbefall, Schimmel, abgelaufen) für Vorräte und Gewürze — inkl. Verlauf der entsorgten Einträge.' },
      { type: 'new',      text: 'Wein: „Weitere Flasche" legt eine Kopie mit allen Merkmalen an.' },
      { type: 'new',      text: 'Wein: Tipp auf eine leere Gitter-Zelle startet die Neuanlage mit vorgewählter Position.' },
      { type: 'improved', text: 'Wein: Gitter-Ansicht im Bestand, Sortierung nach Regal, farbspezifische Emojis und mehrspaltige Liste auf breiten Bildschirmen.' },
      { type: 'improved', text: 'Gewürze: Aktionsknöpfe in der aufgeklappten Karte übersichtlich angeordnet.' },
      { type: 'improved', text: 'Sicherheit: Haushalte, Einladungen, Admin-Funktionen und Schnittstellen deutlich besser abgesichert. Einladungscodes wurden neu erzeugt.' },
      { type: 'improved', text: 'Bring!- und Cookidoo-Zugangsdaten werden jetzt getrennt und geschützt gespeichert.' },
      { type: 'fixed',    text: 'Bring!: Fehler 401 beim Hinzufügen von Artikeln.' },
    ],
  },
  {
    version: '2.8.1',
    date: '2026-08-03',
    entries: [
      { type: 'new',      text: 'Gitter-Positionen sperren: Einzelne Zellen im Weinregal-Gitter sperren — ideal für versetzte oder unregelmäßige Regale.' },
      { type: 'fixed',    text: 'Regaltyp-Wechsel (Fächer/Gitter/Frei) hängte die App nicht mehr auf.' },
    ],
  },
  {
    version: '2.8.0',
    date: '2026-07-05',
    entries: [
      { type: 'new',      text: 'Trinkfenster-Automatik: Trinken-ab/bis wird anhand von Farbe, Rebsorte und Klassifikation geschätzt — manuell überschreibbar.' },
      { type: 'new',      text: 'Klassifikationen verwalten: eigene Einträge hinzufügen und löschen, geräteübergreifend gespeichert.' },
      { type: 'improved', text: 'Benutzereinstellungen (Setup, Shelly, Klassifikationen) werden jetzt in der Cloud gespeichert statt nur lokal.' },
    ],
  },
  {
    version: '2.7.1',
    date: '2026-06-21',
    entries: [
      { type: 'improved', text: 'Accessibility: ARIA-Labels für alle Icon-Buttons — bessere Screenreader-Unterstützung.' },
      { type: 'improved', text: 'Touch-Targets vergrößert (Füllstandsbalken, Auswahl-Buttons) für einfachere Bedienung auf Mobilgeräten.' },
      { type: 'improved', text: 'Escape-Taste schließt jetzt alle Dialoge und Overlays.' },
    ],
  },
  {
    version: '2.7.0',
    date: '2026-06-17',
    entries: [
      { type: 'new',      text: 'Shelly-Sensoren: Temperatur- und Feuchtigkeitssensoren aus der Shelly Cloud mit Weinregalen verknüpfen — Live-Werte in der Lageransicht.' },
    ],
  },
  {
    version: '2.6.0',
    date: '2026-06-15',
    entries: [
      { type: 'improved', text: 'Wein-Detailansicht kompakter: Foto und Infos nebeneinander, Badges für Jahrgang/Farbe/Geschmack, weniger Platzverschwendung.' },
      { type: 'improved', text: 'Wein-Filter dynamisch: Jahrgänge, Länder und Geschmack passen sich an aktive Filter an — keine leeren Optionen mehr.' },
      { type: 'new',      text: 'Sortierrichtung wählbar: Weine auf- oder absteigend nach Name, Jahrgang oder Preis sortieren.' },
      { type: 'fixed',    text: 'Region-Anzeige: kein führendes Komma mehr wenn nur das Land gesetzt ist.' },
    ],
  },
  {
    version: '2.5.0',
    date: '2026-06-15',
    entries: [
      { type: 'new',      text: '„Wusstest du?" auf dem Dashboard: tägliches Wissen über Wein, Gewürze und Kochen — personalisiert aus deinem Bestand.' },
    ],
  },
  {
    version: '2.4.0',
    date: '2026-06-14',
    entries: [
      { type: 'new',      text: 'Wein-Filter: nach Farbe (Rot/Weiß/Rosé/Schaum), Geschmack, Jahrgang und Land filtern — alle kombinierbar.' },
      { type: 'improved', text: 'Weinkarten zeigen jetzt Farbe, Geschmack, Land und Preis direkt in der Übersicht an.' },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-06-14',
    entries: [
      { type: 'new',      text: 'Gitteransicht für Weinregale: Reihe × Spalte Positionen konfigurieren und Flaschen gezielt platzieren.' },
    ],
  },
  {
    version: '2.2.0',
    date: '2026-06-14',
    entries: [
      { type: 'new',      text: 'Lagerorte sortieren: Reihenfolge der Lagerorte in allen Modulen (Gewürze, TK, Wein) manuell per Pfeiltasten festlegen.' },
      { type: 'new',      text: 'Autocomplete: Bei der Eingabe von Namen, Herstellern, Weingütern, Regionen und Rebsorten werden vorhandene Einträge vorgeschlagen.' },
      { type: 'new',      text: 'Plattform-Aktivitätsübersicht: Im Betreiber-Bereich Nutzungsstatistiken und Live-Feed einsehen.' },
      { type: 'fixed',    text: 'Captcha-Fehler beim Login behoben – Turnstile-Widget wird jetzt zuverlässig geladen.' },
    ],
  },
  {
    version: '2.1.0',
    date: '2026-06-13',
    entries: [
      { type: 'new',      text: 'Rezept-Filter: nach Quelle (Cookidoo, YouTube, …), Favoriten und Verfügbarkeit filtern.' },
      { type: 'new',      text: 'Sortierung: Rezepte nach Neueste, A–Z oder Verfügbarkeit sortieren.' },
      { type: 'new',      text: 'Favoriten: Rezepte mit einem Stern markieren und gezielt filtern.' },
      { type: 'new',      text: 'Kategorien: Cookidoo-Kategorien werden beim Sync als Tags übernommen.' },
      { type: 'improved', text: 'Tag-Vorschläge: beim Bearbeiten eines Rezepts werden vorhandene Tags vorgeschlagen.' },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-06-13',
    entries: [
      { type: 'new',      text: 'Dashboard: Neue Startseite mit Überblick über alle Bereiche, ablaufende Items und täglichen Kochvorschlägen.' },
      { type: 'new',      text: 'Kochvorschläge: Rezepte werden nach Verfügbarkeit der Zutaten im Bestand gerankt – bald ablaufende Zutaten werden bevorzugt.' },
      { type: 'new',      text: 'Weinempfehlungen: passende Weine aus dem eigenen Keller zu jedem Rezeptvorschlag.' },
      { type: 'new',      text: 'KptnCook-Import: Rezepte per Share-Link aus KptnCook importieren.' },
      { type: 'new',      text: 'Cookidoo-Sync: Listen auswählen und gezielt Rezepte mit Fotos importieren.' },
      { type: 'new',      text: 'Dashboard anpassbar: Sektionen ein-/ausblenden und Reihenfolge ändern.' },
      { type: 'improved', text: '„Alle löschen" in Admin-Bereich verschoben, mit Löschung nach Rezeptquelle.' },
    ],
  },
  {
    version: '1.9.0',
    date: '2026-06-13',
    entries: [
      { type: 'improved', text: 'TK und Weinkeller werden jetzt in der Cloud gespeichert – Daten bleiben auch nach Cache-Leerung erhalten und sind auf allen Geräten synchron.' },
      { type: 'improved', text: 'Bestehende lokale TK- und Wein-Daten werden beim ersten Login automatisch migriert.' },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-06-13',
    entries: [
      { type: 'improved', text: 'Sicherheits-Härtung: CORS eingeschränkt, API-Endpoints mit Authentifizierung geschützt, SSRF-Schutz für Rezeptimport.' },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-06-13',
    entries: [
      { type: 'improved', text: '„Probiert" heißt jetzt „Weintagebuch" – persönlicher und passender.' },
      { type: 'new',      text: 'Wein-Archiv: Weine im Tagebuch archivieren, um irrelevante auszublenden. Bleiben über Bestand/Lager auffindbar.' },
      { type: 'new',      text: 'Lagerort bearbeiten: Regal und Fach bei Weinen und TK-Einträgen nachträglich ändern.' },
      { type: 'new',      text: 'TK-Einträge bearbeiten: Name, Kategorie, Portionen und Lagerort anpassen.' },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-06-13',
    entries: [
      { type: 'new',      text: 'Mehrfachauswahl: Einträge auswählen und gebündelt löschen – in allen Bereichen.' },
      { type: 'new',      text: 'Bereich leeren: alle Einträge eines Moduls mit einem Klick löschen (mit Bestätigung).' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-06-13',
    entries: [
      { type: 'new',      text: 'Wein-Import: importierte Flaschen landen jetzt im Einräumen-Dialog, wo du Regal und Fach zuweisen kannst.' },
      { type: 'improved', text: 'Einräumen-Badge im Weinkeller zeigt wartende Flaschen an.' },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-06-13',
    entries: [
      { type: 'new',      text: '„Was ist neu?" erscheint jetzt automatisch nach Updates.' },
      { type: 'new',      text: 'Feedback direkt aus der App: Bugs melden oder Features wünschen – landet als GitHub Issue.' },
      { type: 'fixed',    text: 'YouTube-Rezeptimport liefert jetzt zuverlässig Titel, Zutaten und Beschreibung.' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-06-13',
    entries: [
      { type: 'new',      text: 'Einladungs-Links: Familienmitglieder treten jetzt per Link automatisch bei – kein Code-Abtippen mehr.' },
      { type: 'new',      text: 'Eigene Domain: Depot ist jetzt unter depotapp.online erreichbar.' },
      { type: 'improved', text: 'Einladungstexte an alle Module angepasst (nicht mehr nur Gewürze).' },
      { type: 'fixed',    text: 'Betreiber-Ansicht zeigte keine Nutzer an (fehlende Hilfsfunktionen nach Refactoring).' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-06-12',
    entries: [
      { type: 'new',      text: 'Kochen ist jetzt ein eigener Bereich in der Navigation – Rezepte sammeln, importieren und kochen.' },
      { type: 'new',      text: 'Bestandscheck im Rezept: zeigt, welche Zutaten du in Gewürzen, TK und Weinkeller schon hast.' },
      { type: 'new',      text: 'Fehlende Zutaten landen mit einem Tipp auf der Einkaufsliste – einzeln oder alle auf einmal.' },
      { type: 'improved', text: 'Rezeptliste zeigt direkt, wie viele Zutaten vorhanden sind (✓) und was fehlt (✗).' },
      { type: 'improved', text: 'Einheitlicher Plus-Button in allen Bereichen unten rechts.' },
      { type: 'fixed',    text: 'Doppelte Registrierung mit bereits vorhandener E-Mail wird jetzt klar gemeldet.' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-06-10',
    entries: [
      { type: 'new',      text: 'Wein-Empfehlungen per Link teilen – Empfänger brauchen kein Konto.' },
      { type: 'new',      text: '„Mail erneut senden" bei der Registrierung, falls die Bestätigungs-Mail nicht ankommt.' },
      { type: 'improved', text: 'Depot-Branding auf dem Anmeldebildschirm.' },
      { type: 'fixed',    text: 'Demo- und Reset-Buttons entfernt, damit echte Daten nicht versehentlich gelöscht werden.' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-06-08',
    entries: [
      { type: 'new', text: 'Depot startet: Gewürze, Tiefkühl, Weinkeller und gemeinsame Einkaufsliste in einer App.' },
      { type: 'new', text: 'Setup-Assistenten beim ersten Öffnen jedes Bereichs.' },
      { type: 'new', text: 'Excel-Import für TK und Weinkeller.' },
    ],
  },
]

export const APP_VERSION = CHANGELOG[0].version

// ── „Was ist neu?"-Hinweis ───────────────────────────────────────────────────
const SEEN_KEY = 'depot_changelog_seen'

export function hasUnseenChangelog() {
  return localStorage.getItem(SEEN_KEY) !== APP_VERSION
}

export function markChangelogSeen() {
  localStorage.setItem(SEEN_KEY, APP_VERSION)
}
