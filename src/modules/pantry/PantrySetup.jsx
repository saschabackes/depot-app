import { useState } from 'react'
import { usePantry } from './store'
import SetupWizard from '../../components/SetupWizard'

const EMOJI_OPTIONS = ['📦', '🏠', '🚪', '🗄️', '🧹', '🏬', '🔻', '🧊']

function WelcomeStep() {
  return (
    <div className="space-y-4 text-center">
      <div className="bg-amber-50 dark:bg-amber-900/30 rounded-2xl p-5 text-left space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          <strong>Was du hier machen kannst:</strong>
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <li>📦 Vorratsschränke & Regale anlegen</li>
          <li>🏷️ Vorräte erfassen mit MHD & QR-Code</li>
          <li>📱 QR-Code scannen — sofort alle Infos sehen</li>
          <li>⏰ MHD-Warnungen für ablaufende Vorräte</li>
          <li>🛒 Nachkauf-Erinnerungen</li>
        </ul>
      </div>
      <p className="text-xs text-gray-400">Im nächsten Schritt legst du deine Lagerorte an.</p>
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

  return (
    <div className="space-y-4">
      {locations.map(loc => (
        <div key={loc.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <select value={loc.emoji} onChange={e => renameLocation(loc.id, loc.label, e.target.value)}
              className="bg-transparent text-xl">
              {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
            </select>
            <input className="input py-1.5 text-sm flex-1"
              value={loc.label} onChange={e => renameLocation(loc.id, e.target.value, loc.emoji)} />
            <button onClick={() => { if (confirm(`"${loc.label}" löschen?`)) removeLocation(loc.id) }}
              className="text-gray-300 hover:text-red-500 px-2">🗑️</button>
          </div>
          <p className="text-[10px] text-gray-400 uppercase font-bold mt-2 mb-1">Fächer / Regale</p>
          <div className="space-y-1.5">
            {loc.shelves.map(sh => (
              <div key={sh.id} className="flex gap-2">
                <input className="input py-1.5 text-sm flex-1"
                  value={sh.label} onChange={e => renameShelf(loc.id, sh.id, e.target.value)} />
                <button onClick={() => { if (confirm(`"${sh.label}" löschen?`)) removeShelf(loc.id, sh.id) }}
                  className="text-gray-300 hover:text-red-500 px-2">✕</button>
              </div>
            ))}
            <button onClick={() => addShelf(loc.id, `Fach ${loc.shelves.length + 1}`)}
              className="w-full text-xs text-primary-600 font-semibold py-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg">
              + Fach hinzufügen
            </button>
          </div>
        </div>
      ))}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">+ Neuer Lagerort</p>
        <div className="flex gap-2">
          <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
            className="bg-gray-100 dark:bg-gray-700 rounded-lg px-2 text-lg">
            {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
          </select>
          <input className="input py-2 text-sm flex-1"
            placeholder='z.B. "Speisekammer"' value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add() }} />
          <button onClick={add} disabled={!newLabel.trim()}
            className="btn-primary text-sm px-4 disabled:opacity-40">+</button>
        </div>
      </div>
    </div>
  )
}

function TipsStep() {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 space-y-3">
        <p className="font-bold text-sm text-gray-800 dark:text-gray-100">💡 Tipps für den Start</p>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
          <li><strong>QR-Code:</strong> Erfasse einen Vorrat und drucke den QR-Sticker aus — Handy-Kamera drauf, fertig.</li>
          <li><strong>MHD:</strong> Wird als Ablaufdatum gespeichert — du bekommst rechtzeitig eine Warnung.</li>
          <li><strong>Foto:</strong> Fotografiere die Originalverpackung — so hast du Nährwerte & Zutatenliste immer dabei.</li>
          <li><strong>🛒 Nachkaufen:</strong> Markiere Einträge, die auf die Einkaufsliste sollen.</li>
        </ul>
      </div>
      <p className="text-xs text-gray-400 text-center">Du kannst den Assistenten jederzeit über ⚙️ Einstellungen erneut starten.</p>
    </div>
  )
}

export default function PantrySetup({ onComplete }) {
  const steps = [
    { emoji: '📦', title: 'Willkommen zur Vorratskammer', subtitle: 'Dein Vorratsmanager mit QR-Codes', content: <WelcomeStep /> },
    { emoji: '🗄️', title: 'Deine Lagerorte', subtitle: 'Passe die Schränke und Fächer an dein Zuhause an', content: <LocationStep /> },
    { emoji: '🚀', title: 'Bereit!', subtitle: 'Ein paar Tipps zum Einstieg', content: <TipsStep /> },
  ]

  return <SetupWizard module="pantry" steps={steps} onComplete={onComplete} onSkip={onComplete} />
}
