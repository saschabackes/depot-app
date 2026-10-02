import { useState } from 'react'
import { useCellar } from './store'
import { quality } from './cellarUi'
import { SlotEditor, ConditionPicker, EMOJI_OPTIONS } from './RackSettings'
import SetupWizard from '../../components/SetupWizard'
import Icon from '../../ui/Icon'
import { StatusPill } from '../../ui/Controls'
import { confirmAction } from '../../ui/feedback'

const FEATURES = [
  ['boxes',    'Regale, Fächer und Weinkühlschränke verwalten'],
  ['leaf',     'Lagerbedingungen bewerten'],
  ['clock',    'Sehen, welche Flasche jetzt trinkreif ist'],
  ['list',     'Bestehende Sammlung per Excel importieren'],
  ['pot',      'Passende Speisen zu jedem Wein'],
  ['star',     'Verkostungsnotizen und Bewertungen'],
]

function WelcomeStep() {
  return (
    <div className="space-y-3">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-card overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
        {FEATURES.map(([icon, text]) => (
          <div key={text} className="flex items-center gap-3 px-4 py-3">
            <span className="w-9 h-9 flex-none rounded-[10px] flex items-center justify-center bg-[#F4E9EE] text-[#7A2E4A] dark:bg-[#3A2430] dark:text-[#E39BB7]">
              <Icon name={icon} size={20} />
            </span>
            <span className="text-callout text-gray-800 dark:text-gray-100">{text}</span>
          </div>
        ))}
      </div>
      <p className="text-footnote text-center text-gray-500 dark:text-gray-400">Im nächsten Schritt legst du deine Weinlager an.</p>
    </div>
  )
}

function RackStep() {
  const { racks, addRack, renameRack, removeRack, addSlot, renameSlot, removeSlot, setRackConditions } = useCellar()
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('🍷')
  const [expandedRack, setExpandedRack] = useState(null)

  function add() {
    const l = newLabel.trim()
    if (!l) return
    addRack(l, newEmoji)
    setNewLabel(''); setNewEmoji('🍷')
  }

  async function remove(r) {
    if (await confirmAction({ title: `„${r.label}“ löschen?`, message: 'Flaschen darin werden ebenfalls gelöscht.', confirmLabel: 'Löschen', destructive: true })) removeRack(r.id)
  }

  return (
    <div className="space-y-4">
      {racks.map(r => {
        const q = quality(r.conditions)
        const expanded = expandedRack === r.id
        return (
          <div key={r.id} className="bg-gray-50 dark:bg-gray-800 rounded-card overflow-hidden">
            <div className="flex items-center gap-1 pl-2 pr-1 py-1.5">
              <select value={r.emoji} onChange={e => renameRack(r.id, r.label, e.target.value)} aria-label="Symbol"
                className="bg-transparent text-[22px] w-11 h-11 text-center appearance-none">
                {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
              </select>
              <input className="flex-1 min-w-0 bg-transparent text-body font-semibold text-gray-900 dark:text-gray-100 outline-none py-2"
                aria-label="Name des Lagers" value={r.label} onChange={e => renameRack(r.id, e.target.value, r.emoji)} />
              <StatusPill tone={q.tone}>{q.score}/100</StatusPill>
              <button onClick={() => remove(r)} aria-label={`${r.label} löschen`}
                className="w-11 h-11 flex-none flex items-center justify-center text-expired dark:text-expired-dark">
                <Icon name="trash" size={20} />
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-2">
              <p className="text-footnote font-semibold text-gray-500 dark:text-gray-400">Fächer / Plätze</p>
              <SlotEditor rack={r} addSlot={addSlot} renameSlot={renameSlot} removeSlot={removeSlot} />
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setExpandedRack(expanded ? null : r.id)} aria-expanded={expanded}
                className="w-full flex items-center gap-3 px-4 min-h-[48px] text-left">
                <span className="flex-1 text-callout font-semibold text-gray-900 dark:text-gray-100">Lagerbedingungen</span>
                <Icon name="chevron" size={18} strokeWidth={2.2} className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
              {expanded && <div className="px-4 pb-4"><ConditionPicker rack={r} setRackConditions={setRackConditions} /></div>}
            </div>
          </div>
        )
      })}

      <div className="bg-gray-50 dark:bg-gray-800 rounded-card p-4 space-y-3">
        <p className="text-callout font-semibold text-gray-900 dark:text-gray-100">Neues Weinlager</p>
        <div className="flex gap-2">
          <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)} aria-label="Symbol"
            className="bg-gray-100 dark:bg-gray-700 rounded-xl w-12 text-[20px] text-center appearance-none">
            {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
          </select>
          <input className="input flex-1 min-w-0" placeholder="z. B. Regal Diele" aria-label="Name des neuen Lagers" value={newLabel}
            onChange={e => setNewLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} />
          <button onClick={add} disabled={!newLabel.trim()} aria-label="Lager anlegen" className="btn-primary flex-none !px-3">
            <Icon name="plus" size={22} />
          </button>
        </div>
      </div>
    </div>
  )
}

function TipsStep() {
  const tips = [
    ['Lagerbedingungen', 'beeinflussen das Trinkfenster – bewerte sie für genauere Empfehlungen.'],
    ['Passende Speisen', 'findest du in jeder Flasche unter „Passt zu“.'],
    ['Excel-Import', 'für eine bestehende Sammlung: über „…“ neben der Suche.'],
    ['Trinkreif', 'zeigt dir, welche Flaschen jetzt geöffnet werden sollten.'],
    ['Bewertung', 'gibst du direkt beim Trinken ab – samt Anlass und Notiz.'],
  ]
  return (
    <div className="space-y-3">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-card overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
        {tips.map(([k, v]) => (
          <p key={k} className="px-4 py-3 text-callout text-gray-700 dark:text-gray-200"><b className="text-gray-900 dark:text-gray-100">{k}</b> {v}</p>
        ))}
      </div>
      <p className="text-footnote text-center text-gray-500 dark:text-gray-400">Den Assistenten kannst du jederzeit in den Einstellungen erneut starten.</p>
    </div>
  )
}

export default function CellarSetup({ onComplete }) {
  const steps = [
    { emoji: '🍷', title: 'Willkommen beim Weinkeller', subtitle: 'Dein Weinlager-Manager', content: <WelcomeStep /> },
    { emoji: '🗄️', title: 'Deine Weinlager', subtitle: 'Regale, Kühlschränke und Lagerbedingungen einrichten', content: <RackStep /> },
    { emoji: '🚀', title: 'Bereit!', subtitle: 'Ein paar Tipps zum Einstieg', content: <TipsStep /> },
  ]

  return <SetupWizard module="cellar" steps={steps} onComplete={onComplete} onSkip={onComplete} />
}
