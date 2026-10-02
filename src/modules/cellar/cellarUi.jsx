import { Fragment } from 'react'
import { effectiveDrinkUntil, qualityScore, qualityLabel } from './store'
import { colorEmoji } from './wineConstants'
import Icon from '../../ui/Icon'

// ── Trinkfenster als ein kurzer Status ───────────────────────────────────────
// tone: 'soon' (orange) | 'expired' (rotbraun) | null (gedämpft)
export function windowInfo(bottle, rack) {
  if (!bottle.drinkFrom && !bottle.drinkUntil) return { tone: null, text: '' }
  const y = new Date().getFullYear()
  const until = bottle.drinkUntil ? (rack ? effectiveDrinkUntil(bottle, rack) : bottle.drinkUntil) : null
  if (bottle.drinkFrom && y < bottle.drinkFrom) return { tone: null, young: true, text: `Ab ${bottle.drinkFrom}`, long: `Noch ${bottle.drinkFrom - y} J zu jung – ab ${bottle.drinkFrom}` }
  if (until && y > until) return { tone: 'expired', text: 'Trinkfenster vorbei', long: `Trinkfenster seit ${until} vorbei` }
  if (until && until - y <= 1) return { tone: 'soon', text: 'Bald trinken', long: `Bald trinken – bis ${until}` }
  return { tone: null, text: until ? `Bis ${until}` : '', long: until ? `Trinkreif bis ${until}` : '' }
}

export const toneText = tone => tone === 'expired' ? 'font-semibold text-expired dark:text-expired-dark'
  : tone === 'soon' ? 'font-semibold text-soon dark:text-soon-dark'
  : 'text-gray-500 dark:text-gray-400'

// Lagerqualität → Ton für StatusPill
export function quality(conditions) {
  const score = qualityScore(conditions)
  const { label } = qualityLabel(score)
  const tone = score >= 85 ? 'accent' : score >= 65 ? 'neutral' : score >= 40 ? 'soon' : 'expired'
  return { score, label, tone }
}

export function positionLabel(b) {
  if (b.row && b.col) return `Reihe ${b.row} · Platz ${b.col}`
  return b.slot ? `Fach ${b.slot}` : ''
}

// ── Kleine Bausteine ─────────────────────────────────────────────────────────
export function WineThumb({ bottle, size = 36, dim = false }) {
  if (bottle.photoData) {
    return <img src={bottle.photoData} alt="" className={`flex-none rounded-lg object-cover bg-gray-100 dark:bg-gray-700 ${dim ? 'opacity-60' : ''}`}
      style={{ width: size, height: Math.round(size * 1.25) }} />
  }
  return (
    <span className={`flex-none rounded-[10px] bg-[#F4E9EE] dark:bg-[#3A2430] flex items-center justify-center ${dim ? 'opacity-60' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }} aria-hidden="true">
      {colorEmoji(bottle.color)}
    </span>
  )
}

export function CheckCircle({ on }) {
  return (
    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-none ${on ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
      {on && <Icon name="check" size={14} strokeWidth={3} />}
    </span>
  )
}

export function FactTile({ label, value, sub }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-[14px] px-3.5 py-3 min-w-0">
      <div className="text-footnote text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mt-0.5 break-words">{value}</div>
      {sub && <div className="text-footnote text-gray-500 dark:text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// Abschnitt in Formularen/Sheets: Überschrift + weiße Karte
export function FormSection({ title, footer, children, className = '' }) {
  return (
    <section className={`px-4 ${className}`}>
      {title && <h2 className="px-4 pb-1.5 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h2>}
      <div className="bg-white dark:bg-gray-800 rounded-card p-4 space-y-4">{children}</div>
      {footer && <p className="px-4 pt-1.5 text-footnote text-gray-500 dark:text-gray-400">{footer}</p>}
    </section>
  )
}

export function Stars({ value = 0, onChange, size = 22, label = 'Bewertung' }) {
  if (!onChange) {
    return (
      <span className="inline-flex gap-0.5 text-[#C98A00] dark:text-[#F5C47A]" role="img" aria-label={`${value} von 5 Sternen`}>
        {Array.from({ length: value }, (_, i) => <Icon key={i} name="star" size={size} strokeWidth={1.6} className="fill-current" />)}
      </span>
    )
  }
  return (
    <div className="flex" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i === value ? 0 : i)}
          aria-label={`${i} Stern${i > 1 ? 'e' : ''}`} aria-pressed={i <= value}
          className={`w-11 h-11 flex items-center justify-center ${i <= value ? 'text-[#C98A00] dark:text-[#F5C47A]' : 'text-gray-300 dark:text-gray-600'}`}>
          <Icon name="star" size={size} strokeWidth={1.6} className={i <= value ? 'fill-current' : ''} />
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon = 'wine', title, text, action }) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-14 gap-3">
      <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center"><Icon name={icon} size={30} /></span>
      <h3 className="text-headline text-gray-900 dark:text-gray-100">{title}</h3>
      {text && <p className="text-callout text-gray-500 dark:text-gray-400">{text}</p>}
      {action}
    </div>
  )
}

// Horizontale Auswahl (z. B. Regal) – Stil wie die Status-Chips
export function ChipRow({ items, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
      {items.map(it => {
        const on = it.id === value
        return (
          <button key={it.id} onClick={() => onChange(it.id)}
            className={`flex-none min-h-[34px] px-3.5 rounded-full text-[14px] font-semibold ${
              on ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
            {it.label}{it.count != null && <> <span className={on ? 'opacity-70' : 'text-gray-500 dark:text-gray-400'}>{it.count}</span></>}
          </button>
        )
      })}
    </div>
  )
}

// ── Regalgitter ──────────────────────────────────────────────────────────────
// mode: 'view' (Flasche öffnen / leeren Platz belegen) | 'pick' (Platz wählen) | 'block' (Plätze sperren)
export function RackGrid({ rack, bottles, mode = 'view', selected, onCell }) {
  const blocked = new Set(rack.conditions?.blockedCells ?? [])
  const occupied = bottles.filter(b => b.rackId === rack.id && b.row != null && b.col != null && b.count > 0)
  const cell = 'w-11 h-11 rounded-lg flex items-center justify-center relative'

  function renderCell(r1, c1) {
    const key = `${r1}-${c1}`
    const pos = `Reihe ${r1}, Platz ${c1}`
    const here = occupied.filter(b => b.row === r1 && b.col === c1)
    const total = here.reduce((s, b) => s + b.count, 0)
    const first = here[0]

    if (blocked.has(key)) {
      if (mode === 'block') {
        return (
          <button key={key} type="button" onClick={() => onCell(r1, c1)} aria-label={`${pos}: gesperrt – entsperren`}
            className={`${cell} bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300`}>
            <Icon name="close" size={16} strokeWidth={2.4} />
          </button>
        )
      }
      return <span key={key} className={`${cell} bg-gray-200/70 dark:bg-gray-700/60`} aria-label={`${pos}: gesperrt`} role="img" />
    }

    if (mode === 'pick') {
      const sel = selected?.row === r1 && selected?.col === c1
      return (
        <button key={key} type="button" onClick={() => onCell(r1, c1)} aria-pressed={sel}
          aria-label={`${pos}${total ? `, belegt (${total})` : ''}`}
          className={`${cell} text-footnote font-semibold ${sel ? 'bg-primary-500 text-white'
            : total > 0 ? 'bg-soon-soft text-soon dark:bg-soon-dark-soft dark:text-soon-dark'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
          {sel ? <Icon name="check" size={18} strokeWidth={2.6} /> : total > 0 ? total : ''}
        </button>
      )
    }

    if (mode === 'block') {
      return (
        <button key={key} type="button" onClick={() => onCell(r1, c1)} aria-label={`${pos}: sperren`}
          className={`${cell} text-footnote font-semibold ${total > 0
            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-200'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
          {total > 0 ? total : ''}
        </button>
      )
    }

    return (
      <button key={key} type="button" onClick={() => onCell(r1, c1, first)}
        aria-label={first ? `${pos}: ${first.name}${total > 1 ? ` (${total} Flaschen)` : ''}` : `${pos}: leer – Flasche hinzufügen`}
        className={`${cell} ${total > 0
          ? 'bg-[#F4E9EE] dark:bg-[#3A2430] active:opacity-70'
          : 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-600 active:bg-primary-50 dark:active:bg-primary-900'}`}>
        {total > 0 ? (
          <>
            <span className="text-[20px] leading-none" aria-hidden="true">{colorEmoji(first?.color)}</span>
            {total > 1 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-white text-[11px] font-bold leading-[18px] text-center">{total}</span>
            )}
          </>
        ) : <Icon name="plus" size={16} strokeWidth={2.2} />}
      </button>
    )
  }

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="grid gap-1 w-max mx-auto pt-1 pr-1" style={{ gridTemplateColumns: `20px repeat(${rack.cols}, 44px)` }}>
        {Array.from({ length: rack.rows }, (_, ri) => (
          <Fragment key={ri}>
            <span className="text-caption text-gray-400 flex items-center justify-end pr-1">{ri + 1}</span>
            {Array.from({ length: rack.cols }, (_, ci) => renderCell(ri + 1, ci + 1))}
          </Fragment>
        ))}
        <span />
        {Array.from({ length: rack.cols }, (_, ci) => (
          <span key={ci} className="text-caption text-gray-400 text-center">{ci + 1}</span>
        ))}
      </div>
    </div>
  )
}
