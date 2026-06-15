import { useState } from 'react'

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

export function ClassificationPicker({ value, onChange }) {
  const [expanded, setExpanded] = useState(false)
  const [custom, setCustom] = useState('')
  const isKnown = ALL_CLASSIFICATIONS.includes(value)
  const isCustom = value && !isKnown

  return (
    <div className="space-y-2">
      {/* Häufigste direkt sichtbar */}
      <div className="flex gap-1.5 flex-wrap">
        {['Kabinett', 'Spätlese', 'Auslese', 'DOC', 'DOCG', 'AOC', 'Reserva', 'Grand Cru'].map(c => (
          <button key={c} type="button"
            onClick={() => onChange(value === c ? '' : c)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
              value === c ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>{c}</button>
        ))}
        <button type="button" onClick={() => setExpanded(o => !o)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
            expanded ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>{expanded ? '▾ Weniger' : '▸ Alle'}</button>
      </div>

      {/* Alle nach Land gruppiert */}
      {expanded && (
        <div className="space-y-2">
          {CLASSIFICATION_GROUPS.map(g => (
            <div key={g.label}>
              <p className="text-[10px] font-bold text-gray-400 mb-1">{g.label}</p>
              <div className="flex gap-1.5 flex-wrap">
                {g.items.map(c => (
                  <button key={c} type="button"
                    onClick={() => onChange(value === c ? '' : c)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
                      value === c ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>{c}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Freitext für Sonderfälle */}
      <div className="flex gap-2 items-center">
        <input
          className="input text-sm flex-1"
          placeholder="Oder eigene eingeben…"
          value={isCustom ? value : custom}
          onChange={e => { setCustom(e.target.value); onChange(e.target.value) }}
        />
        {isCustom && (
          <button type="button" onClick={() => { onChange(''); setCustom('') }}
            className="text-xs text-gray-400 hover:text-gray-600">✕</button>
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
          <button key={c.code} type="button"
            onClick={() => onChange(value === c.label ? '' : c.label)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
              value === c.label ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>{c.flag} {c.label}</button>
        ))}
        <button type="button" onClick={() => setShowMore(o => !o)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
            showMore ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>{showMore ? '▾ Weniger' : '▸ Weitere'}</button>
      </div>
      {showMore && (
        <div className="flex gap-1.5 flex-wrap">
          {WINE_COUNTRIES_MORE.map(c => (
            <button key={c.code} type="button"
              onClick={() => onChange(value === c.label ? '' : c.label)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
                value === c.label ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>{c.flag} {c.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}
