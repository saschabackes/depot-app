import { useState } from 'react'
import { useCellar } from './store'
import Icon from '../../ui/Icon'

// Weinfarben – das Emoji ist Inhalt (Farbe des Weins), keine Bedienung
export const COLOR_EMOJI = { rot: '🍷', weiß: '🥂', rosé: '🌸', schaum: '🍾' }
export const colorEmoji = color => COLOR_EMOJI[color] || '🍷'
export const COLOR_OPTIONS = [
  { id: 'rot',    label: 'Rot' },
  { id: 'weiß',   label: 'Weiß' },
  { id: 'rosé',   label: 'Rosé' },
  { id: 'schaum', label: 'Schaum' },
]

export const WINE_COUNTRIES_TOP = [
  { code: 'DE', flag: '🇩🇪', label: 'Deutschland' },
  { code: 'FR', flag: '🇫🇷', label: 'Frankreich' },
  { code: 'IT', flag: '🇮🇹', label: 'Italien' },
  { code: 'ES', flag: '🇪🇸', label: 'Spanien' },
  { code: 'AT', flag: '🇦🇹', label: 'Österreich' },
]
export const WINE_COUNTRIES_MORE = [
  { code: 'AR', flag: '🇦🇷', label: 'Argentinien' },
  { code: 'AU', flag: '🇦🇺', label: 'Australien' },
  { code: 'BR', flag: '🇧🇷', label: 'Brasilien' },
  { code: 'BG', flag: '🇧🇬', label: 'Bulgarien' },
  { code: 'CL', flag: '🇨🇱', label: 'Chile' },
  { code: 'GR', flag: '🇬🇷', label: 'Griechenland' },
  { code: 'HR', flag: '🇭🇷', label: 'Kroatien' },
  { code: 'LB', flag: '🇱🇧', label: 'Libanon' },
  { code: 'LU', flag: '🇱🇺', label: 'Luxemburg' },
  { code: 'MX', flag: '🇲🇽', label: 'Mexiko' },
  { code: 'MD', flag: '🇲🇩', label: 'Moldau' },
  { code: 'NZ', flag: '🇳🇿', label: 'Neuseeland' },
  { code: 'PT', flag: '🇵🇹', label: 'Portugal' },
  { code: 'RO', flag: '🇷🇴', label: 'Rumänien' },
  { code: 'CH', flag: '🇨🇭', label: 'Schweiz' },
  { code: 'RS', flag: '🇷🇸', label: 'Serbien' },
  { code: 'SI', flag: '🇸🇮', label: 'Slowenien' },
  { code: 'ZA', flag: '🇿🇦', label: 'Südafrika' },
  { code: 'TR', flag: '🇹🇷', label: 'Türkei' },
  { code: 'HU', flag: '🇭🇺', label: 'Ungarn' },
  { code: 'US', flag: '🇺🇸', label: 'USA' },
  { code: 'UY', flag: '🇺🇾', label: 'Uruguay' },
  { code: 'GE', flag: '🇬🇪', label: 'Georgien' },
]

export function isSparkling(color, wineType) {
  return color === 'schaum' || wineType === 'sekt'
}

export const CLASSIFICATION_GROUPS = [
  { label: '🇩🇪 Deutschland', items: ['Kabinett', 'Spätlese', 'Auslese', 'Beerenauslese', 'Trockenbeerenauslese', 'Eiswein', 'Qualitätswein', 'Landwein', 'VDP Große Lage', 'VDP Erste Lage', 'VDP Ortswein', 'VDP Gutswein'] },
  { label: '🇮🇹 Italien', items: ['DOCG', 'DOC', 'IGT', 'Riserva', 'Superiore', 'Classico'] },
  { label: '🇫🇷 Frankreich', items: ['AOC', 'AOP', 'Grand Cru', 'Premier Cru', 'Cru Bourgeois', 'Vin de Pays', 'IGP'] },
  { label: '🇪🇸 Spanien', items: ['DOCa', 'DO', 'Crianza', 'Reserva', 'Gran Reserva', 'Joven'] },
  { label: '🇵🇹 Portugal', items: ['DOC', 'Vinho Regional', 'Reserva', 'Grande Reserva'] },
  { label: '🇦🇹 Österreich', items: ['DAC', 'Qualitätswein', 'Prädikatswein', 'Kabinett', 'Spätlese', 'Auslese', 'Strohwein'] },
]

const ALL_CLASSIFICATIONS = CLASSIFICATION_GROUPS.flatMap(g => g.items)

// Auswahl-Chip (Formulare, Filter)
export function Chip({ on, onClick, children, className = '' }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`min-h-[36px] px-3 rounded-full text-[14px] font-semibold transition-colors ${
        on ? 'bg-primary-500 text-white dark:bg-primary-300 dark:text-gray-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'} ${className}`}>
      {children}
    </button>
  )
}

export function ClassificationPicker({ value, onChange }) {
  const [expanded, setExpanded] = useState(false)
  const [custom, setCustom] = useState('')
  const customClassifications = useCellar(s => s.customClassifications)
  const addClassification = useCellar(s => s.addClassification)
  const removeClassification = useCellar(s => s.removeClassification)
  const allKnown = [...ALL_CLASSIFICATIONS, ...customClassifications]
  const isKnown = allKnown.includes(value)
  const isCustom = value && !isKnown

  function saveCustom() {
    const val = (isCustom ? value : custom).trim()
    if (!val || allKnown.includes(val)) return
    addClassification(val)
    onChange(val)
    setCustom('')
  }

  return (
    <div className="space-y-2.5">
      {/* Eigene Klassifikationen */}
      {customClassifications.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {customClassifications.map(c => (
            <span key={c} className={`inline-flex items-center rounded-full ${
              value === c ? 'bg-primary-500 text-white dark:bg-primary-300 dark:text-gray-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
              <button type="button" onClick={() => onChange(value === c ? '' : c)}
                className="min-h-[36px] pl-3 pr-1 text-[14px] font-semibold">{c}</button>
              <button type="button" onClick={() => { if (value === c) onChange(''); removeClassification(c) }}
                aria-label={`${c} entfernen`} className="w-9 h-9 flex items-center justify-center opacity-60">
                <Icon name="close" size={14} strokeWidth={2.4} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Häufigste direkt sichtbar */}
      <div className="flex gap-1.5 flex-wrap">
        {['Kabinett', 'Spätlese', 'Auslese', 'DOC', 'DOCG', 'AOC', 'Reserva', 'Grand Cru'].map(c => (
          <Chip key={c} on={value === c} onClick={() => onChange(value === c ? '' : c)}>{c}</Chip>
        ))}
        <button type="button" onClick={() => setExpanded(o => !o)}
          className="min-h-[36px] px-3 text-[14px] font-semibold text-primary-500 dark:text-primary-300">
          {expanded ? 'Weniger' : 'Alle zeigen'}
        </button>
      </div>

      {/* Alle nach Land gruppiert */}
      {expanded && (
        <div className="space-y-2.5">
          {CLASSIFICATION_GROUPS.map(g => (
            <div key={g.label}>
              <p className="text-footnote font-semibold text-gray-500 dark:text-gray-400 mb-1">{g.label}</p>
              <div className="flex gap-1.5 flex-wrap">
                {g.items.map(c => (
                  <Chip key={c} on={value === c} onClick={() => onChange(value === c ? '' : c)}>{c}</Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Freitext + Merken */}
      <div className="flex gap-2 items-center">
        <input
          className="input flex-1"
          placeholder="Eigene eingeben …"
          value={isCustom ? value : custom}
          onChange={e => { setCustom(e.target.value); onChange(e.target.value) }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveCustom() } }}
        />
        {(isCustom || custom.trim()) && (
          <button type="button" onClick={saveCustom}
            className="min-h-[44px] px-2 text-callout font-semibold text-primary-500 dark:text-primary-300 whitespace-nowrap">Merken</button>
        )}
        {isCustom && (
          <button type="button" onClick={() => { onChange(''); setCustom('') }} aria-label="Klassifikation leeren"
            className="w-11 h-11 flex items-center justify-center text-gray-400">
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

export function CountryPicker({ value, onChange }) {
  const isInMore = WINE_COUNTRIES_MORE.some(c => c.label === value)
  const [showMore, setShowMore] = useState(isInMore)

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5 flex-wrap">
        {WINE_COUNTRIES_TOP.map(c => (
          <Chip key={c.code} on={value === c.label} onClick={() => onChange(value === c.label ? '' : c.label)}>{c.flag} {c.label}</Chip>
        ))}
        <button type="button" onClick={() => setShowMore(o => !o)}
          className="min-h-[36px] px-3 text-[14px] font-semibold text-primary-500 dark:text-primary-300">
          {showMore ? 'Weniger' : 'Weitere'}
        </button>
      </div>
      {showMore && (
        <div className="flex gap-1.5 flex-wrap">
          {WINE_COUNTRIES_MORE.map(c => (
            <Chip key={c.code} on={value === c.label} onClick={() => onChange(value === c.label ? '' : c.label)}>{c.flag} {c.label}</Chip>
          ))}
        </div>
      )}
    </div>
  )
}
