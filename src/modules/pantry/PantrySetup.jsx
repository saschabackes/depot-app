import { useState } from 'react'
import { usePantry } from './store'
import SetupWizard from '../../components/SetupWizard'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow, IconTile } from '../../ui/List'
import { confirmAction } from '../../ui/feedback'

const EMOJI_OPTIONS = ['📦', '🏠', '🚪', '🗄️', '🧹', '🏬', '🔻', '🧊']

function WelcomeStep() {
  const features = [
    ['pantry', 'Vorratsschränke & Fächer anlegen'],
    ['clock', 'Vorräte mit MHD erfassen – mit Warnung vor Ablauf'],
    ['qr', 'QR-Etikett drucken, scannen, sofort alle Infos sehen'],
    ['cart', 'Nachkaufen vormerken – erscheint im Einkauf'],
  ]
  return (
    <div className="space-y-3">
      <ListGroup className="!px-0">
        {features.map(([icon, text]) => (
          <ListRow key={icon} leading={<IconTile icon={icon} tone="pantry" size={32} />}
            title={<span className="font-normal whitespace-normal">{text}</span>} />
        ))}
      </ListGroup>
      <p className="text-footnote text-gray-500 dark:text-gray-400 text-center">Im nächsten Schritt legst du deine Lagerorte an.</p>
    </div>
  )
}

function LocationStep() {
  const { locations, addLocation, renameLocation, removeLocation, addShelf, renameShelf, removeShelf } = usePantry()
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('📦')

  function add() {
    const l = newLabel.trim()
    if (!l) return
    addLocation(l, newEmoji)
    setNewLabel(''); setNewEmoji('📦')
  }

  async function deleteLocation(loc) {
    if (await confirmAction({ title: `„${loc.label}“ löschen?`, message: 'Alle Vorräte an diesem Lagerort werden mitgelöscht.', confirmLabel: 'Löschen', destructive: true })) removeLocation(loc.id)
  }
  async function deleteShelf(loc, sh) {
    if (await confirmAction({ title: `„${sh.label}“ löschen?`, message: 'Alle Vorräte in diesem Fach werden mitgelöscht.', confirmLabel: 'Löschen', destructive: true })) removeShelf(loc.id, sh.id)
  }

  return (
    <div className="space-y-4">
      {locations.map(loc => (
        <div key={loc.id} className="bg-white dark:bg-gray-800 rounded-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <select value={loc.emoji} onChange={e => renameLocation(loc.id, loc.label, e.target.value)}
              aria-label="Symbol" className="h-11 bg-gray-100 dark:bg-gray-700 rounded-[10px] px-1.5 text-xl">
              {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
            </select>
            <input className="input py-2 flex-1 min-w-0" aria-label="Name des Lagerorts"
              value={loc.label} onChange={e => renameLocation(loc.id, e.target.value, loc.emoji)} />
            <button onClick={() => deleteLocation(loc)} aria-label={`${loc.label} löschen`}
              className="w-11 h-11 flex-none flex items-center justify-center text-gray-400">
              <Icon name="trash" size={20} />
            </button>
          </div>
          <p className="px-1 pt-1 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Fächer / Regale</p>
          <div className="space-y-1.5">
            {loc.shelves.map(sh => (
              <div key={sh.id} className="flex items-center gap-2">
                <input className="input py-2 flex-1 min-w-0" aria-label="Name des Fachs"
                  value={sh.label} onChange={e => renameShelf(loc.id, sh.id, e.target.value)} />
                <button onClick={() => deleteShelf(loc, sh)} aria-label={`${sh.label} löschen`}
                  className="w-11 h-11 flex-none flex items-center justify-center text-gray-400">
                  <Icon name="close" size={18} strokeWidth={2.2} />
                </button>
              </div>
            ))}
            <button onClick={() => addShelf(loc.id, `Fach ${loc.shelves.length + 1}`)}
              className="w-full min-h-[44px] flex items-center justify-center gap-1.5 text-callout font-semibold text-primary-500 dark:text-primary-300 rounded-[10px] active:bg-gray-100 dark:active:bg-gray-700">
              <Icon name="plus" size={18} strokeWidth={2.2} />Fach hinzufügen
            </button>
          </div>
        </div>
      ))}

      <div className="bg-white dark:bg-gray-800 rounded-card p-3 space-y-2">
        <p className="px-1 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Neuer Lagerort</p>
        <div className="flex items-center gap-2">
          <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
            aria-label="Symbol" className="h-11 bg-gray-100 dark:bg-gray-700 rounded-[10px] px-1.5 text-xl">
            {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
          </select>
          <input className="input py-2 flex-1 min-w-0"
            placeholder="z. B. Speisekammer" value={newLabel} aria-label="Name des neuen Lagerorts"
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add() }} />
          <button onClick={add} disabled={!newLabel.trim()} aria-label="Lagerort hinzufügen"
            className="btn-primary w-12 px-0 flex-none">
            <Icon name="plus" size={22} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  )
}

function TipsStep() {
  const tips = [
    ['QR-Etikett', 'Erfasse einen Vorrat und drucke das Etikett – Handy-Kamera drauf, fertig.'],
    ['MHD', 'Wird als Ablaufdatum gespeichert – du bekommst rechtzeitig eine Warnung.'],
    ['Foto', 'Fotografiere die Originalverpackung – so hast du Nährwerte und Zutaten immer dabei.'],
    ['Nachkaufen', 'Markiere Einträge, die auf die Einkaufsliste sollen.'],
  ]
  return (
    <div className="space-y-3">
      <ListGroup className="!px-0">
        {tips.map(([title, text]) => (
          <div key={title} className="px-4 py-3">
            <p className="text-body font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            <p className="text-callout text-gray-600 dark:text-gray-300">{text}</p>
          </div>
        ))}
      </ListGroup>
      <p className="text-footnote text-gray-500 dark:text-gray-400 text-center">
        Lagerorte und Fächer kannst du später jederzeit im Vorrat über den Filter-Knopf bearbeiten.
      </p>
    </div>
  )
}

export default function PantrySetup({ onComplete }) {
  const steps = [
    { emoji: '📦', title: 'Willkommen im Vorrat', subtitle: 'Dein Vorratsmanager mit QR-Etiketten', content: <WelcomeStep /> },
    { emoji: '🗄️', title: 'Deine Lagerorte', subtitle: 'Passe Schränke und Fächer an dein Zuhause an', content: <LocationStep /> },
    { emoji: '🚀', title: 'Bereit!', subtitle: 'Ein paar Tipps zum Einstieg', content: <TipsStep /> },
  ]

  return <SetupWizard module="pantry" steps={steps} onComplete={onComplete} onSkip={onComplete} />
}
