import { useFreezer } from './store'
import SetupWizard from '../../components/SetupWizard'
import Icon from '../../ui/Icon'
import { StorageEditor, NewStorageRow } from './StorageSettings'

function Bullets({ items }) {
  return (
    <ul className="bg-white dark:bg-gray-800 rounded-card divide-y divide-gray-100 dark:divide-gray-700 text-left shadow-sm">
      {items.map(([icon, text]) => (
        <li key={text} className="flex items-start gap-3 px-4 py-3">
          <Icon name={icon} size={22} className="text-[#2F6690] dark:text-[#8DBBE0] mt-0.5" />
          <span className="text-callout text-gray-700 dark:text-gray-200">{text}</span>
        </li>
      ))}
    </ul>
  )
}

function WelcomeStep() {
  return (
    <div className="space-y-4">
      <Bullets items={[
        ['snow', 'Gefrierschränke und Fächer anlegen'],
        ['mic', 'Einträge per Schnelleingabe, Sprache oder Formular erfassen'],
        ['clock', 'Haltbarkeit und Portionen im Blick behalten'],
        ['inbox', 'Bestehende Listen aus Excel importieren'],
        ['cart', 'Nachkaufen direkt auf die Einkaufsliste setzen'],
      ]} />
      <p className="text-footnote text-gray-500 dark:text-gray-400 text-center">Im nächsten Schritt legst du deine Gefrierschränke an.</p>
    </div>
  )
}

function StorageStep() {
  const storages = useFreezer(s => s.storages)
  return (
    <div className="-mx-5 py-4 space-y-5 bg-gray-50 dark:bg-gray-900">
      {storages.map(s => <StorageEditor key={s.id} storage={s} />)}
      <NewStorageRow />
    </div>
  )
}

function TipsStep() {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-card divide-y divide-gray-100 dark:divide-gray-700 shadow-sm">
        {[
          ['Schnelleingabe', 'Tippe z. B. „3 Lasagne Keller Korb 2“ – Menge und Ort werden automatisch erkannt.'],
          ['Wischen', 'Nach links wischen zieht eine Portion ab. Antippen öffnet alle Details.'],
          ['Excel-Import', 'Schon eine Liste? Über das Zahnrad neben der Suche importierst du sie.'],
          ['Haltbarkeit', 'Wird automatisch aus der Kategorie berechnet.'],
          ['Nachkaufen', 'Markierte Einträge landen auf der Einkaufsliste.'],
        ].map(([t, d]) => (
          <div key={t} className="px-4 py-3">
            <p className="text-callout font-semibold text-gray-900 dark:text-gray-100">{t}</p>
            <p className="text-footnote text-gray-500 dark:text-gray-400 mt-0.5">{d}</p>
          </div>
        ))}
      </div>
      <p className="text-footnote text-gray-500 dark:text-gray-400 text-center">Den Assistenten startest du jederzeit über das Zahnrad im Tiefkühl erneut.</p>
    </div>
  )
}

export default function FreezerSetup({ onComplete }) {
  const steps = [
    { emoji: '❄️', title: 'Willkommen im Tiefkühl', subtitle: 'Dein Gefrierschrank-Überblick', content: <WelcomeStep /> },
    { emoji: '🧊', title: 'Deine Gefrierschränke', subtitle: 'Passe Schränke und Fächer an dein Zuhause an', content: <StorageStep /> },
    { emoji: '✨', title: 'Bereit', subtitle: 'Ein paar Tipps zum Einstieg', content: <TipsStep /> },
  ]

  return <SetupWizard module="freezer" steps={steps} onComplete={onComplete} onSkip={onComplete} />
}
