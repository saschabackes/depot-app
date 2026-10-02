import { useState } from 'react'
import useStore from '../store/useStore'
import { APP_NAME, MODULES_ENABLED } from '../branding'
import Sheet from '../ui/Sheet'
import Icon from '../ui/Icon'
import { ListGroup, ListRow } from '../ui/List'

// Hilfe-Inhalte, gruppiert nach Themenbereich
const HELP_GROUPS = [
  {
    group: 'Erste Schritte',
    items: [
      {
        emoji: '🌿',
        title: 'Gewürz hinzufügen',
        body: [
          'Tippe auf den runden Plus-Button unten rechts.',
          'Pflichtangaben sind nur Name und Verpackungstyp. Je nach Typ kommen Gramm und/oder Stückzahl dazu.',
          'Beim Tippen des Namens erscheinen Vorschläge gängiger Gewürze – einfach antippen zum Übernehmen.',
          'Alle weiteren Felder (Marke, Foto, MHD, Lagerort, Kategorie, Notizen) sind optional und können auch später ergänzt werden.',
        ],
      },
      {
        emoji: '📦',
        title: 'Verpackungstypen verstehen',
        body: [
          'Fertigstreuer: gekaufter Streuer (z.B. Ostmann) – du gibst Gramm pro Packung und Anzahl der Streuer an.',
          'Nachfüllpackung: lose Ware im Beutel – nur Menge in Gramm.',
          'Ganze Gewürze: z.B. Muskatnuss oder Lorbeer – Stückzahl.',
          'Eigener Metallstreuer: selbst befüllt – Anzahl der Streuer.',
          'Der Typ bestimmt welche Mengenfelder erscheinen und dient als Filter in der Vorratsliste.',
        ],
      },
    ],
  },
  {
    group: 'Gewürze verwalten',
    items: [
      {
        emoji: '📸',
        title: 'Produktfoto hinzufügen',
        body: [
          'Im Bearbeitungsformular gibt es drei Wege zum Bild:',
          '1. Foto / Galerie – eigenes Foto aufnehmen oder aus der Mediathek wählen (wird automatisch verkleinert).',
          '2. Bild-URL einfügen – wenn du einen Link zu einem Bild hast.',
          '3. „Foto aus Datenbank suchen" – sucht automatisch nach Hersteller + Gewürzname im Internet und zeigt Vorschläge. Tipp: Marke mit angeben verbessert die Treffer deutlich.',
          'In der Vorratsliste kannst du auf das kleine Vorschaubild tippen, um es vergrößert anzuzeigen.',
        ],
      },
      {
        emoji: '📊',
        title: 'Füllstand pflegen',
        body: [
          'Die vier kleinen Balken rechts auf jeder Karte zeigen wie voll ein Gewürz noch ist.',
          'Tippe auf die Balken, um eine Stufe runterzuschalten: Voll → Gut → Halb → Wenig → Fast leer.',
          'Nach „Fast leer" springt ein weiterer Tipp zurück auf Voll – praktisch wenn du eine neue Packung gekauft hast.',
          'Bei „Fast leer" blinkt der unterste Balken rot als Warnsignal.',
          'Den Füllstand kannst du auch beim Bearbeiten eines Gewürzes setzen.',
        ],
      },
      {
        emoji: '↓',
        title: 'Nachkaufen-Hinweis',
        body: [
          'Wenn ein Gewürz zur Neige geht, erscheint ein orangener „↓ Nachkaufen"-Hinweis auf der Karte.',
          'Wichtig bei Mehrfach-Bestand: Der Hinweis kommt erst, wenn ALLE Einheiten einer Sorte niedrig sind.',
          'Beispiel: Du hast zwei Päckchen Curry. Erst wenn beide auf „Wenig" oder „Fast leer" stehen, wird Nachkaufen vorgeschlagen.',
          'Im Statusstreifen ganz oben siehst du „X nachkaufen" – tippe darauf, um die Liste auf genau diese Gewürze zu filtern.',
        ],
      },
      {
        emoji: '📅',
        title: 'Mindesthaltbarkeit (MHD)',
        body: [
          'Trage optional das MHD eines Gewürzes ein.',
          'Läuft es in weniger als einem Monat ab, erscheint ein oranges Datum-Badge; ist es abgelaufen, ein rotes mit ⚠.',
          'Der Ablauf-Tab oben listet alle Gewürze nach Datum sortiert – ideal um regelmäßig auszumisten.',
          'In der Vorratsliste kannst du oben rechts zwischen Sortierung A–Z und nach MHD umschalten.',
        ],
      },
      {
        emoji: '🏷️',
        title: 'Kategorien & Lagerorte',
        body: [
          'Kategorien (z.B. Kräuter, Asiatisch, Scharf) und Lagerorte (z.B. Oberschrank, Keller) legst du in den Einstellungen an.',
          'Jeder Kategorie kannst du eine Farbe geben, damit sie in der Liste sofort erkennbar ist.',
          'Beim Bearbeiten eines Gewürzes wählst du Kategorie und Lagerort aus den Dropdowns.',
          'In der Vorratsliste erscheinen sie als Filter-Chips – so findest du z.B. „alles im Keller" mit einem Tipp.',
        ],
      },
      {
        emoji: '🔍',
        title: 'Suchen & Filtern',
        body: [
          'Das Suchfeld oben in der Vorratsliste durchsucht die Gewürznamen.',
          'Darunter filterst du nach Verpackungstyp, Kategorie und Lagerort – mehrere Filter lassen sich kombinieren.',
          'Ein erneuter Tipp auf einen aktiven Filter hebt ihn wieder auf.',
        ],
      },
    ],
  },
  ...(MODULES_ENABLED ? [{
    group: 'Tiefkühl, Wein & Kochen',
    items: [
      {
        emoji: '❄️',
        title: 'Tiefkühl-Vorräte',
        body: [
          'Im TK-Bereich verwaltest du mehrere Gefrierschränke mit ihren Schubladen.',
          'Jeder Eintrag hat Portionen, Kategorie und Einfrierdatum – die empfohlene Haltbarkeit wird automatisch berechnet.',
          'Eine Portion entnommen? Auf „−1" tippen oder die Zeile nach links wischen.',
          'Die Quick-Add-Zeile oben versteht z.B. „3 Lasagne Keller Korb 2" und legt den Eintrag direkt richtig ab.',
          'Per Excel-Import (📥 oben) holst du bestehende Listen in die App.',
        ],
      },
      {
        emoji: '🍷',
        title: 'Weinkeller',
        body: [
          'Flaschen mit Lagerplatz (Regal/Fach), Trinkfenster, Rebsorte und Bewertung erfassen.',
          'Die Lagerbedingungen deiner Regale (Temperatur, Licht, Feuchte) fließen in eine Qualitätseinschätzung ein.',
          'Der Ablauf-Tab zeigt, welche Weine bald getrunken werden sollten.',
          'Über das 🔗-Symbol teilst du Empfehlungen als Link – Empfänger brauchen keine App.',
        ],
      },
      {
        emoji: '📖',
        title: 'Rezepte & Bestandscheck',
        body: [
          'Im Kochen-Bereich speicherst du Rezepte per Link (Cookidoo, YouTube, Chefkoch & Co.) – Zutaten und Schritte werden automatisch übernommen, wo möglich.',
          'Der Bestandscheck im Rezept gleicht jede Zutat mit Gewürzen, TK und Weinkeller ab und zeigt, was du schon hast.',
          'Fehlende Zutaten wandern einzeln oder alle auf einmal auf die Einkaufsliste.',
          'In der Rezeptliste zeigen ✓- und ✗-Badges auf einen Blick, wie gut dein Bestand zum Rezept passt.',
        ],
      },
    ],
  }] : []),
  {
    group: 'Einkaufen',
    items: [
      {
        emoji: '🛒',
        title: 'Einkaufsliste nutzen',
        body: [
          'Tippe eine Gewürzkarte an, damit sie sich aufklappt, und dann auf „Einkaufen" – das Gewürz landet auf der Einkaufsliste.',
          'Den Einkauf-Tab findest du unten in der Navigation.',
          'Erledigte Artikel kannst du abhaken und gesammelt entfernen.',
        ],
      },
      {
        emoji: '🔗',
        title: 'Bring!-Anbindung',
        body: [
          'In den Einstellungen kannst du dein Bring!-Konto verknüpfen.',
          'Danach wandern „Einkaufen"-Artikel direkt in deine Bring!-Liste – auch per Alexa abrufbar.',
          'Gewürze werden automatisch mit dem Tag „Gewürz" markiert, sodass du in der Ansicht zwischen „nur Gewürze" und „alle Artikel" umschalten kannst.',
          'Artikel, die du in Bring! abhakst, verschwinden auch hier.',
        ],
      },
    ],
  },
  {
    group: 'Haushalt & Teilen',
    items: [
      {
        emoji: '🏠',
        title: 'Mit Familie teilen',
        body: [
          'Öffne Einstellungen → Verwaltung → Einladen und wähle „Familie / Mitbewohner".',
          MODULES_ENABLED
            ? 'Teile den Einladungscode – die Person tritt deinem Haushalt bei und ihr verwaltet Gewürze, TK, Wein und Rezepte gemeinsam.'
            : 'Teile den Einladungscode – die Person tritt deinem Haushalt bei und ihr verwaltet die Gewürze gemeinsam.',
          'Alle Änderungen sind sofort für alle Mitglieder sichtbar.',
        ],
      },
      {
        emoji: '👤',
        title: 'Freunde empfehlen',
        body: [
          'Im Einladen-Bereich gibt es den Modus „Freunde".',
          'Dabei wird KEIN Code geteilt – dein Freund erstellt seinen eigenen, unabhängigen Haushalt mit eigener Sammlung.',
          'Du kannst eine persönliche Nachricht hinzufügen; die App generiert daraus eine fertige Empfehlung zum Teilen.',
        ],
      },
      {
        emoji: '🔑',
        title: 'Konto & Passwort',
        body: [
          'Bei der Registrierung bestätigst du deine E-Mail über einen Link – wichtig, damit das Zurücksetzen des Passworts funktioniert.',
          'Passwort vergessen? Auf der Anmeldeseite auf „Vergessen?" tippen und der Anleitung in der E-Mail folgen.',
          'Haushaltsinhaber können in den Einstellungen Mitglieder verwalten (Passwort-Reset anstoßen, Rollen ändern, entfernen).',
        ],
      },
    ],
  },
  {
    group: 'Daten & Darstellung',
    items: [
      {
        emoji: '💾',
        title: 'Datensicherung',
        body: [
          MODULES_ENABLED
            ? 'Einstellungen → Datensicherung exportiert deine kompletten Daten (Gewürze, TK, Weine, Rezepte, Kategorien, Lagerorte) als Datei auf dein Gerät.'
            : 'Einstellungen → Datensicherung exportiert deine komplette Sammlung (Gewürze, Kategorien, Lagerorte) als Datei auf dein Gerät.',
          'Empfehlung: ab und zu ein Backup ziehen – die Datei ist lesbar und lässt sich aufbewahren.',
          'So bist du auf der sicheren Seite, falls mal etwas schiefgeht.',
        ],
      },
      {
        emoji: '🌙',
        title: 'Hell / Dunkel',
        body: [
          'Unter Einstellungen → Darstellung wählst du zwischen System, Hell und Dunkel.',
          'Im System-Modus folgt die App automatisch der Einstellung deines Geräts (z.B. nachts dunkel).',
          'Die Auswahl gilt pro Gerät.',
        ],
      },
      {
        emoji: '📲',
        title: 'Als App installieren',
        body: [
          'Die App lässt sich wie eine echte App auf dem Homebildschirm ablegen.',
          'iPhone (Safari): Teilen-Symbol → „Zum Home-Bildschirm".',
          'Android (Chrome): Menü → „App installieren" bzw. „Zum Startbildschirm hinzufügen".',
          'Danach startet sie im Vollbild ohne Browser-Leiste.',
        ],
      },
    ],
  },
]

export default function HelpView({ onClose }) {
  const [openKey, setOpenKey] = useState(null)
  const startOnboarding = useStore(s => s.startOnboarding)

  return (
    <Sheet title="Hilfe" onClose={onClose} cancelLabel="Schließen">
      <div className="space-y-6">
        <p className="px-6 text-callout text-gray-600 dark:text-gray-300">
          Willkommen bei {APP_NAME}! Tippe auf ein Thema, um die Erklärung aufzuklappen.
        </p>
        <div className="px-4">
          <button onClick={() => { startOnboarding(); onClose() }} className="btn-secondary w-full">
            <Icon name="sparkle" size={20} />Einführung erneut ansehen
          </button>
        </div>

        {HELP_GROUPS.map(group => (
          <ListGroup key={group.group} title={group.group}>
            {group.items.map(item => {
              const key = group.group + item.title
              const isOpen = openKey === key
              return (
                <div key={key}>
                  <ListRow onClick={() => setOpenKey(isOpen ? null : key)} title={item.title}
                    trailing={<Icon name="chevron" size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />} />
                  {isOpen && (
                    <ul className="px-4 pb-4 space-y-2">
                      {item.body.map((line, i) => (
                        <li key={i} className="text-callout text-gray-600 dark:text-gray-300 leading-relaxed">{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </ListGroup>
        ))}

        <p className="text-footnote text-gray-500 text-center pb-2">
          Noch Fragen? Schreib uns über „Feedback“ in den Einstellungen.
        </p>
      </div>
    </Sheet>
  )
}
