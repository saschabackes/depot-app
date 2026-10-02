import { useMemo } from 'react'
import useStore from '../store/useStore'
import { getMhdStatus, formatAmount } from '../utils/mhd'
import { PACKAGING_TYPES } from '../data/spices'
import Icon from '../ui/Icon'
import { ListGroup, ListRow } from '../ui/List'
import { StatusPill } from '../ui/Controls'

// Gruppen nach Dringlichkeit (Statuswerte aus getMhdStatus)
const GROUPS = [
  { status: 'expired',  title: 'Abgelaufen' },
  { status: 'critical', title: 'Diesen Monat' },
  { status: 'warning',  title: 'Nächste 3 Monate' },
  { status: 'ok',       title: 'Später' },
  { status: 'none',     title: 'Ohne MHD' },
]

const mmYYYY = iso => {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function trailingFor(spice, mhd) {
  if (mhd.status === 'none') return <span className="text-footnote text-gray-400 dark:text-gray-500">Kein MHD</span>
  if (mhd.status === 'expired') {
    const over = Math.abs(mhd.days)
    return (
      <div className="flex flex-col items-end gap-1 flex-none">
        <StatusPill tone="expired">Seit {mmYYYY(spice.expiryDate)}</StatusPill>
        <span className="text-footnote text-gray-500 dark:text-gray-400">{over === 1 ? '1 Tag drüber' : `${over} Tage drüber`}</span>
      </div>
    )
  }
  if (mhd.status === 'critical') {
    return (
      <div className="flex flex-col items-end gap-1 flex-none">
        <StatusPill tone="soon">{mhd.days <= 1 ? 'Läuft ab' : `Noch ${mhd.days} Tage`}</StatusPill>
        <span className="text-footnote text-gray-500 dark:text-gray-400">{mmYYYY(spice.expiryDate)}</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-end flex-none">
      <span className={`text-callout font-semibold ${mhd.status === 'warning' ? 'text-soon dark:text-soon-dark' : 'text-gray-700 dark:text-gray-200'}`}>{mmYYYY(spice.expiryDate)}</span>
      <span className="text-footnote text-gray-500 dark:text-gray-400">
        {mhd.status === 'warning' ? `noch ${mhd.days} Tage` : `noch ${Math.round(mhd.days / 30)} Monate`}
      </span>
    </div>
  )
}

export default function ExpiryView({ onEdit }) {
  const rawSpices = useStore(s => s.spices)

  const groups = useMemo(() => {
    const active = rawSpices
      .filter(s => !s.disposedAt)
      .map(s => ({ spice: s, mhd: getMhdStatus(s.expiryDate) }))
      .sort((a, b) => {
        if (!a.spice.expiryDate) return 1
        if (!b.spice.expiryDate) return -1
        return a.spice.expiryDate.localeCompare(b.spice.expiryDate) || a.spice.name.localeCompare(b.spice.name, 'de')
      })
    return GROUPS
      .map(g => ({ ...g, items: active.filter(x => x.mhd.status === g.status) }))
      .filter(g => g.items.length > 0)
  }, [rawSpices])

  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const urgent = groups.filter(g => g.status === 'expired' || g.status === 'critical').reduce((n, g) => n + g.items.length, 0)

  if (total === 0) {
    return (
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col items-center text-center px-8 py-14 gap-3">
          <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center"><Icon name="clock" size={30} /></span>
          <h3 className="text-headline text-gray-900 dark:text-gray-100">Noch keine Gewürze</h3>
          <p className="text-callout text-gray-500 dark:text-gray-400">Sobald du Gewürze mit Haltbarkeitsdatum anlegst, siehst du hier, was zuerst weg muss.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      <div className="pt-3 pb-28 space-y-5">
        <p className="px-8 text-footnote text-gray-500 dark:text-gray-400">
          {urgent === 0 ? 'Alles im grünen Bereich – nichts läuft in den nächsten 30 Tagen ab.'
            : urgent === 1 ? '1 Gewürz ist abgelaufen oder läuft diesen Monat ab.'
            : `${urgent} Gewürze sind abgelaufen oder laufen diesen Monat ab.`}
        </p>
        {groups.map(g => (
          <ListGroup key={g.status} title={`${g.title} · ${g.items.length}`}>
            {g.items.map(({ spice, mhd }) => {
              const pkg = PACKAGING_TYPES.find(t => t.id === spice.packagingType)?.label
              return (
                <ListRow key={spice.id} onClick={() => onEdit(spice)}
                  leading={spice.imageUrl ? <img src={spice.imageUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-gray-50 dark:bg-gray-700 flex-none" /> : null}
                  title={spice.name}
                  subtitle={[spice.brand, formatAmount(spice) || pkg].filter(Boolean).join(' · ')}
                  trailing={trailingFor(spice, mhd)} />
              )
            })}
          </ListGroup>
        ))}
      </div>
    </div>
  )
}
