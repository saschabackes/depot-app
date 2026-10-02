import { useState } from 'react'
import { useCellar } from './store'
import { Chip } from './wineConstants'
import { WineThumb } from './cellarUi'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow } from '../../ui/List'
import { StatusPill } from '../../ui/Controls'
import { confirmAction, showToast } from '../../ui/feedback'

export default function WinePendingView({ onClose }) {
  const { pending, racks, addBottle, removePending, clearPending } = useCellar()
  const defaultRackId = racks[0]?.id || ''
  const defaultSlot = racks[0]?.slots?.[0] || ''

  const [assignments, setAssignments] = useState(() => {
    const map = {}
    pending.forEach(p => {
      map[p.id] = {
        rackId: p.rackId || defaultRackId,
        slot: p.slot || (racks.find(r => r.id === p.rackId)?.slots?.[0]) || defaultSlot,
      }
    })
    return map
  })

  const [expandedId, setExpandedId] = useState(null)

  function setRack(pid, rackId) {
    const rack = racks.find(r => r.id === rackId)
    setAssignments(a => ({ ...a, [pid]: { rackId, slot: rack?.slots?.[0] || '' } }))
  }

  function setSlot(pid, slot) {
    setAssignments(a => ({ ...a, [pid]: { ...a[pid], slot } }))
  }

  function shelveOne(p) {
    const a = assignments[p.id] || { rackId: defaultRackId, slot: defaultSlot }
    addBottle({
      name: p.name, winery: p.winery, vintage: p.vintage,
      region: p.region, country: p.country, grape: p.grape,
      color: p.color, wineType: p.wineType, sweetness: p.sweetness,
      classification: p.classification, alcohol: p.alcohol,
      alcoholFree: p.alcoholFree,
      drinkFrom: p.drinkFrom, drinkUntil: p.drinkUntil,
      count: p.count || 1, priceEur: p.priceEur,
      retailer: p.retailer, note: p.note,
      rackId: a.rackId, slot: a.slot,
    })
    removePending(p.id)
  }

  function shelveAll() {
    const n = pending.length
    pending.forEach(p => shelveOne(p))
    onClose()
    showToast(`${n} ${n === 1 ? 'Wein' : 'Weine'} eingeräumt.`)
  }

  async function discardAll() {
    const ok = await confirmAction({ title: `Alle ${pending.length} verwerfen?`, message: 'Die wartenden Weine werden nicht eingeräumt.', confirmLabel: 'Alle verwerfen', destructive: true })
    if (ok) { clearPending(); onClose() }
  }

  if (pending.length === 0) return null

  const unassigned = pending.filter(p => !assignments[p.id]?.rackId)

  return (
    <Sheet title="Weine einräumen" onClose={onClose} cancelLabel="Schließen" confirmLabel="Alle einräumen" onConfirm={shelveAll} z={60}>
      <div className="space-y-5">
        <p className="px-8 text-callout text-center text-gray-500 dark:text-gray-400">
          {pending.length} {pending.length === 1 ? 'Wein wartet' : 'Weine warten'}. Tippe einen an, um Regal und Fach zu wählen.
        </p>

        {unassigned.length > 0 && (
          <div className="px-4">
            <div className="rounded-card bg-soon-soft dark:bg-soon-dark-soft text-soon dark:text-soon-dark px-4 py-3 text-callout font-semibold">
              {unassigned.length} {unassigned.length === 1 ? 'Wein' : 'Weine'} ohne Lagerort – bitte Regal zuweisen.
            </div>
          </div>
        )}

        <ListGroup>
          {pending.map(p => {
            const a = assignments[p.id] || {}
            const rack = racks.find(r => r.id === a.rackId)
            const expanded = expandedId === p.id
            const sub = [p.winery, p.vintage, p.grape, (p.count || 1) > 1 && `${p.count}×`].filter(Boolean).join(' · ')
            return (
              <div key={p.id}>
                <ListRow onClick={() => setExpandedId(expanded ? null : p.id)}
                  leading={<WineThumb bottle={p} />}
                  title={p.name}
                  subtitle={sub}
                  trailing={<>
                    {rack
                      ? <span className="text-footnote text-gray-500 dark:text-gray-400 truncate max-w-[110px]">{rack.label}{a.slot ? ` · ${a.slot}` : ''}</span>
                      : <StatusPill tone="soon">Kein Regal</StatusPill>}
                    <Icon name="chevron" size={18} strokeWidth={2.2} className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  </>} />

                {expanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {p.rackLabel && !a.rackId && <p className="text-footnote text-gray-500 dark:text-gray-400">In der Excel-Datei: „{p.rackLabel}“</p>}
                    <div>
                      <p className="text-footnote font-semibold text-gray-500 dark:text-gray-400 mb-1">Regal</p>
                      <div className="flex flex-wrap gap-1.5">
                        {racks.map(r => <Chip key={r.id} on={a.rackId === r.id} onClick={() => setRack(p.id, r.id)}>{r.emoji} {r.label}</Chip>)}
                      </div>
                    </div>
                    {rack && rack.slots.length > 0 && (
                      <div>
                        <p className="text-footnote font-semibold text-gray-500 dark:text-gray-400 mb-1">Fach</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rack.slots.map(s => <Chip key={s} on={a.slot === s} onClick={() => setSlot(p.id, s)}>{s}</Chip>)}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => shelveOne(p)} className="btn-primary flex-1">Einräumen</button>
                      <button onClick={() => removePending(p.id)} className="min-h-[48px] px-4 text-callout font-semibold text-expired dark:text-expired-dark">Verwerfen</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </ListGroup>

        <div className="flex justify-center">
          <button onClick={discardAll} className="min-h-[44px] px-4 text-callout font-semibold text-expired dark:text-expired-dark">Alle verwerfen</button>
        </div>
      </div>
    </Sheet>
  )
}
