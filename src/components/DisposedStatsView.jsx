import { useMemo, useState } from 'react'
import useStore from '../store/useStore'
import { usePantry } from '../modules/pantry/store'
import { MODULES_ENABLED } from '../branding'
import { disposedEntries, computeStats, PERIODS, AREA_LABEL } from '../utils/disposedStats'
import Sheet from '../ui/Sheet'
import { ListGroup, ListRow, IconTile } from '../ui/List'
import { Segmented } from '../ui/Controls'

const AREA_ICON = { spices: { icon: 'leaf', tone: 'spices' }, pantry: { icon: 'pantry', tone: 'pantry' } }

// „Was wir wegwerfen“: Entsorgtes nach Grund und Produkt (Gewürze und Vorrat)
export default function DisposedStatsView({ onClose, onOpen }) {
  const spices = useStore(s => s.spices)
  const pantryItems = usePantry(s => s.items)
  const [period, setPeriod] = useState('3m')

  const entries = useMemo(() => disposedEntries(spices, pantryItems, { withPantry: MODULES_ENABLED }), [spices, pantryItems])
  const stats = useMemo(() => computeStats(entries, period), [entries, period])

  const tiles = [
    { label: 'Entsorgt', value: stats.total },
    { label: 'Gewürze', value: stats.spices },
    ...(MODULES_ENABLED ? [{ label: 'Vorrat', value: stats.pantry }] : []),
  ]

  return (
    <Sheet title="Was wir wegwerfen" onClose={onClose} cancelLabel="Schließen">
      {entries.length === 0 ? (
        <div className="flex flex-col items-center text-center px-8 py-10 gap-3">
          <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center text-[28px]" aria-hidden>🌿</span>
          <h3 className="text-headline text-gray-900 dark:text-gray-100">Noch nichts entsorgt – gut so.</h3>
          <p className="text-callout text-gray-500 dark:text-gray-400">
            Entsorgtes erfasst du im Detail eines Gewürzes{MODULES_ENABLED ? ' oder Vorrats' : ''} – dann siehst du hier, was und warum.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="px-4">
            <Segmented label="Zeitraum" value={period} onChange={setPeriod} options={PERIODS.map(p => ({ id: p.id, label: p.label }))} />
          </div>

          {stats.total === 0 ? (
            <p className="px-8 py-6 text-center text-callout text-gray-500 dark:text-gray-400">In diesem Zeitraum nichts entsorgt – gut so.</p>
          ) : (
            <>
              <div className="px-4 space-y-3">
                <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}>
                  {tiles.map(t => (
                    <div key={t.label} className="bg-white dark:bg-gray-800 rounded-card p-3.5">
                      <div className="text-[26px] leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-50">{t.value}</div>
                      <div className="text-callout text-gray-500 dark:text-gray-400">{t.label}</div>
                    </div>
                  ))}
                </div>
                {stats.tip && <p className="px-1 text-callout text-gray-600 dark:text-gray-300">{stats.tip}</p>}
              </div>

              <ListGroup title="Gründe">
                {stats.reasons.map(r => (
                  <div key={r.id || 'none'} className="px-4 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-body text-gray-900 dark:text-gray-100">{r.label}</span>
                      <span className="text-body font-semibold text-gray-900 dark:text-gray-100">{r.count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden" aria-hidden>
                      <div className="h-full rounded-full bg-primary-500 dark:bg-primary-300" style={{ width: `${Math.round((r.count / stats.total) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </ListGroup>

              <ListGroup title="Am häufigsten">
                {stats.products.map(p => {
                  const main = AREA_ICON[p.latest.area]
                  const areas = [...p.areas].map(a => AREA_LABEL[a]).join(', ')
                  return (
                    <ListRow key={p.name.toLowerCase()} chevron
                      onClick={() => onOpen(p.latest.area, p.latest.area === 'pantry' ? p.latest.id : null)}
                      leading={<IconTile icon={main.icon} tone={main.tone} />}
                      title={p.name} subtitle={`${p.count}× · ${areas}`} />
                  )
                })}
              </ListGroup>
            </>
          )}
        </div>
      )}
    </Sheet>
  )
}
