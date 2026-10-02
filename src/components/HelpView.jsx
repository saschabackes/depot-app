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
      { title: 'So ist die App aufgebaut', body: MODULES_ENABLED ? [
        'Unten wechselst du zwischen fünf Tabs: Start, Bestand, Kochen, Einkauf und Mehr.',
        'Start zeigt, was Aufmerksamkeit braucht (Abgelaufenes, fast Leeres, Weine im Trinkfenster) und durchsucht alle Bereiche auf einmal.',
        'Unter Bestand findest du Gewürze, Tiefkühl, Wein und Vorrat sowie „Noch einzuräumen“.',
        'Mehr enthält Einstellungen, Verlauf, Neuigkeiten, Hilfe und Abmelden.',
      ] : [
        'Oben siehst du deine Gewürze, umschaltbar zwischen „Bestand“ und „Ablauf“.',
        'Über das Menü oben rechts erreichst du die Einstellungen.',
      ] },
      { title: 'Etwas hinzufügen', body: [
        'Im jeweiligen Bereich oben rechts auf „+“ tippen.',
        'Der Name reicht zum Start – per Barcode-Scan werden Name, Marke, Bild und Menge oft automatisch ausgefüllt.',
        'Alles Weitere (Foto, MHD, Lagerort, Notizen) kannst du später ergänzen.',
      ] },
      { title: 'Einträge ansehen und ändern', body: [
        'Tippe einen Eintrag an: Es öffnet sich die Detailansicht mit allen Angaben und Aktionen.',
        'Oben rechts „Bearbeiten“, unten „Eintrag löschen“.',
        'Zum Aussortieren lieber „Entsorgen …“ mit Grund wählen – dann bleibt nachvollziehbar, was weggeworfen wurde.',
      ] },
    ],
  },
  {
    group: 'Gewürze',
    items: [
      { title: 'Füllstand pflegen', body: [
        'In der Detailansicht wählst du den Füllstand von „Fast leer“ bis „Voll“.',
        'In der Liste zeigen vier kleine Balken rechts den aktuellen Stand.',
      ] },
      { title: 'Nachkaufen-Hinweis', body: [
        '„Nachkaufen“ erscheint erst, wenn ALLE Packungen eines Gewürzes fast leer sind – zwei Päckchen Curry lösen den Hinweis also erst aus, wenn beide leer werden.',
        'Mit dem Filter „Nachkaufen“ oben siehst du genau diese Gewürze.',
      ] },
      { title: 'Mindesthaltbarkeit', body: [
        'Orange heißt: läuft innerhalb eines Monats ab. Rotbraun heißt: abgelaufen.',
        'Die Ansicht „Ablauf“ sortiert alle Gewürze nach Dringlichkeit – ideal zum regelmäßigen Ausmisten.',
      ] },
      { title: 'Lagerorte, Kategorien, Filter', body: [
        'Lagerorte und Kategorien verwaltest du über das Zahnrad in der Gewürze-Kopfleiste.',
        'Die Liste ist nach Lagerort gruppiert. Über den Filter-Knopf neben der Suche filterst du nach Lagerort, Verpackung und Kategorie oder sortierst nach Ablaufdatum.',
        'Dort findest du auch „Mehrere auswählen …“ zum gesammelten Löschen.',
      ] },
    ],
  },
  ...(MODULES_ENABLED ? [{
    group: 'Tiefkühl, Wein, Vorrat & Kochen',
    items: [
      { title: 'Tiefkühl', body: [
        'Mehrere Gefrierschränke mit Schubladen – verwaltet über das Zahnrad.',
        'Die Haltbarkeit wird aus Kategorie und Einfrierdatum berechnet.',
        'Portion entnommen? In der Detailansicht „Portion entnehmen“ tippen oder die Zeile nach links wischen.',
        'Die Schnelleingabe oben versteht z. B. „3 Lasagne Keller Korb 2“.',
      ] },
      { title: 'Wein', body: [
        'Flaschen mit Regalplatz, Trinkfenster, Rebsorte und Bewertung. Über den Gitter-Knopf siehst du dein Regal als Raster – ein Tipp auf einen freien Platz legt dort eine Flasche an.',
        '„Trinkreif“ zeigt, was jetzt getrunken werden sollte, „Tagebuch“ deine Notizen.',
        'Weine lassen sich als Link weiterempfehlen – Empfänger brauchen keine App.',
      ] },
      { title: 'Vorrat & QR-Etiketten', body: [
        'Für Lebensmittel in Vorratsdosen: Lagerort, Fach, Menge und MHD.',
        'In der Detailansicht „Etikett“ druckt ein QR-Etikett. Scannst du es später mit dem Handy, öffnet sich direkt dieser Eintrag.',
        'Klappt das Drucken in der installierten App nicht, öffne Depot einmal in Safari.',
      ] },
      { title: 'Rezepte & Bestandscheck', body: [
        'Rezepte per Link speichern (Cookidoo, YouTube, Chefkoch & Co.) – Zutaten werden übernommen, wo möglich.',
        'Der Bestandscheck zeigt, was du schon hast, und setzt Fehlendes mit einem Tipp auf die Einkaufsliste.',
        'Der Filter „Kann ich kochen“ zeigt Rezepte, für die du das meiste im Haus hast.',
      ] },
    ],
  }] : []),
  {
    group: 'Einkaufen',
    items: [
      { title: 'Einkaufsliste', body: [
        'In der Detailansicht eines Eintrags „Auf die Einkaufsliste“ tippen – oder direkt im Einkauf-Tab etwas eintragen.',
        'Abgehakte Gewürze warten danach unter „Noch einzuräumen“, bis sie im Regal stehen.',
        'Erledigte Artikel lassen sich gesammelt entfernen.',
      ] },
      { title: 'Bring!-Anbindung', body: [
        'Unter Mehr → Einstellungen verknüpfst du dein Bring!-Konto.',
        'Danach landen Artikel direkt in deiner Bring!-Liste – auch per Alexa abrufbar.',
        'Was du in Bring! abhakst, verschwindet auch hier.',
      ] },
    ],
  },
  {
    group: 'Haushalt & Konto',
    items: [
      { title: 'Mit Familie teilen', body: [
        'Unter Mehr → Einstellungen → Haushalt findest du deinen Einladungscode zum Teilen.',
        'Wer beitritt, sieht denselben Bestand – Änderungen erscheinen sofort bei allen.',
        'Haushaltsinhaber verwalten Mitglieder im Bereich „Mitglieder“.',
      ] },
      { title: 'Konto & Passwort', body: [
        'Bei der Registrierung bestätigst du deine E-Mail über einen Link.',
        'Passwort vergessen? Auf der Anmeldeseite „Vergessen?“ tippen.',
      ] },
      { title: 'Datensicherung', body: [
        'Unter Einstellungen → Datensicherung exportierst du alle Daten als Datei.',
        'Ab und zu ein Backup schadet nie.',
      ] },
      { title: 'Hell / Dunkel', body: [
        'Unter Einstellungen → Darstellung: Automatisch, Hell oder Dunkel. „Automatisch“ folgt deinem Gerät.',
      ] },
      { title: 'Als App installieren', body: [
        'iPhone (Safari): Teilen-Symbol → „Zum Home-Bildschirm“.',
        'Android (Chrome): Menü → „App installieren“.',
      ] },
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
