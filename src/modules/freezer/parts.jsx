import Icon from '../../ui/Icon'
import { CATEGORIES } from './store'

// Gemeinsame Helfer für den Tiefkühl-Bereich

export const categoryOf = id => CATEGORIES.find(c => c.id === id) ?? { id, label: id, emoji: '📦' }

function parseLocalDate(str) {
  if (!str) return null
  const [y, m, d] = str.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function daysUntil(dateStr) {
  const d = parseLocalDate(dateStr)
  if (!d) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

export function formatDate(dateStr) {
  const d = parseLocalDate(dateStr)
  return d ? d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–'
}

// Ablaufstatus wie bei den Gewürzen: bald = orange, abgelaufen = rotbraun, sonst grau
export const SOON_DAYS = 30
export function expiryInfo(item) {
  const days = daysUntil(item.expiryDate)
  if (days === null) return { tone: null, text: '', days: null }
  if (days < 0) return { tone: 'expired', text: 'Abgelaufen', days }
  if (days <= SOON_DAYS) return { tone: 'soon', text: days === 0 ? 'Läuft heute ab' : days === 1 ? 'Noch 1 Tag' : `Noch ${days} Tage`, days }
  const d = parseLocalDate(item.expiryDate)
  return { tone: null, text: `bis ${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`, days }
}

export const expiryClass = tone =>
  tone === 'expired' ? 'font-semibold text-expired dark:text-expired-dark'
  : tone === 'soon' ? 'font-semibold text-soon dark:text-soon-dark'
  : 'text-gray-500 dark:text-gray-400'

export function portionsText(item) {
  if (item.portionSize) return `${item.portions} × ${item.portionSize}`
  return item.portions === 1 ? '1 Portion' : `${item.portions} Portionen`
}

export function locationOf(storages, item) {
  const storage = storages.find(s => s.id === item.storageId)
  const compartment = storage?.compartments.find(c => c.id === item.compartmentId)
  return { storage, compartment }
}

// Kleines Bild bzw. Kategorie-Emoji am Zeilenanfang
export function ItemThumb({ item, size = 36 }) {
  if (item.photoData) {
    return <img src={item.photoData} alt="" className="flex-none rounded-[10px] object-cover bg-gray-100 dark:bg-gray-700" style={{ width: size, height: size }} />
  }
  return (
    <span aria-hidden="true" className="flex-none rounded-[10px] bg-[#E6EEF5] dark:bg-[#1C2A36] flex items-center justify-center text-[19px] leading-none"
      style={{ width: size, height: size }}>{categoryOf(item.category).emoji}</span>
  )
}

// iOS-Schalter
export function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative flex-none w-[51px] h-[31px] rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
      <span className={`absolute top-[2px] left-[2px] w-[27px] h-[27px] rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[20px]' : ''}`} />
    </button>
  )
}

// Plus/Minus-Zähler (Tippflächen 44 px)
export function Stepper({ value, onChange, min = 1, label }) {
  const n = Number(value) || min
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, n - 1))} disabled={n <= min} aria-label="Weniger"
        className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 text-primary-500 dark:text-primary-300 flex items-center justify-center disabled:opacity-40">
        <Icon name="minus" size={20} strokeWidth={2.4} />
      </button>
      <input type="number" inputMode="numeric" min={min} value={value} onChange={e => onChange(e.target.value)} aria-label={label}
        className="w-12 text-center bg-transparent text-[17px] font-semibold text-gray-900 dark:text-gray-100 outline-none" />
      <button type="button" onClick={() => onChange(n + 1)} aria-label="Mehr"
        className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 text-primary-500 dark:text-primary-300 flex items-center justify-center">
        <Icon name="plus" size={20} strokeWidth={2.4} />
      </button>
    </div>
  )
}

// Feld-Zeile innerhalb eines weißen Blocks (Label links, Eingabe rechts/unten)
export function FieldRow({ label, children, stacked = false }) {
  return (
    <div className={`px-4 py-2.5 min-h-[50px] ${stacked ? 'space-y-1.5' : 'flex items-center gap-3'}`}>
      <span className={stacked ? 'block text-footnote font-semibold text-gray-500 dark:text-gray-400' : 'flex-none text-body text-gray-900 dark:text-gray-100'}>{label}</span>
      <div className={stacked ? '' : 'flex-1 min-w-0 flex justify-end'}>{children}</div>
    </div>
  )
}

// Auswahlliste ohne Rahmen für FieldRow
export function InlineSelect({ value, onChange, children, label }) {
  return (
    <div className="relative max-w-full">
      <select value={value ?? ''} onChange={e => onChange(e.target.value)} aria-label={label}
        className="appearance-none bg-transparent text-right text-body text-gray-500 dark:text-gray-400 pr-6 py-2 outline-none max-w-full truncate">
        {children}
      </select>
      <Icon name="chevron" size={16} strokeWidth={2.2} className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
    </div>
  )
}
