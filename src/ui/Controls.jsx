import Icon from './Icon'

export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label}
      className="grid p-0.5 rounded-[10px] bg-gray-200/70 dark:bg-gray-700"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(o => {
        const on = o.id === value
        return (
          <button key={o.id} role="tab" aria-selected={on} onClick={() => onChange(o.id)}
            className={`h-8 rounded-lg text-[14px] font-semibold transition-colors ${
              on ? 'bg-white dark:bg-gray-500 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function SearchField({ value, onChange, placeholder = 'Suchen', trailing, label }) {
  return (
    <label className="flex items-center gap-2 h-10 px-3 rounded-[10px] bg-gray-200/70 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
      <Icon name="search" size={17} strokeWidth={2} />
      <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="flex-1 min-w-0 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400" />
      {value && (
        <button onClick={() => onChange('')} aria-label="Suche leeren" className="w-6 h-6 rounded-full bg-gray-400/60 text-white flex items-center justify-center">
          <Icon name="close" size={12} strokeWidth={3} />
        </button>
      )}
      {trailing}
    </label>
  )
}

// Statushinweis: soon = bald (orange), expired = abgelaufen (rotbraun), ok, neutral
export function StatusPill({ tone = 'neutral', children }) {
  const tones = {
    soon:    'bg-soon-soft text-soon dark:bg-soon-dark-soft dark:text-soon-dark',
    expired: 'bg-expired-soft text-expired dark:bg-expired-dark-soft dark:text-expired-dark',
    accent:  'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-200',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  }
  return <span className={`inline-flex items-center text-footnote font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${tones[tone]}`}>{children}</span>
}

// Füllstand als Segmente (1–4)
export function FillSegments({ level = 4, max = 4 }) {
  return (
    <div className="flex gap-[3px]" role="img" aria-label={`Füllstand ${level} von ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`w-2.5 h-1.5 rounded-sm ${i < level ? (level <= 1 ? 'bg-soon dark:bg-soon-dark' : 'bg-primary-500 dark:bg-primary-300') : 'bg-gray-200 dark:bg-gray-600'}`} />
      ))}
    </div>
  )
}
