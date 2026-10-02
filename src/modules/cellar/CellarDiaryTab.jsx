import { ListGroup, ListRow } from '../../ui/List'
import Icon from '../../ui/Icon'
import { WineThumb, Stars, EmptyState } from './cellarUi'

// Weintagebuch: bewertet ODER mind. 1× getrunken (egal ob noch Bestand)
const tasted = b => !b.archived && (b.rating > 0 || b.history?.length > 0)

export function memoryCounts(bottles) {
  return [
    { id: 'all',      label: 'Alle',         count: bottles.filter(tasted).length },
    { id: 'loved',    label: 'Lieblinge',    count: bottles.filter(b => !b.archived && (b.rating || 0) >= 4).length },
    { id: 'stocked',  label: 'Im Bestand',   count: bottles.filter(b => tasted(b) && b.count > 0).length },
    { id: 'empty',    label: 'Ausgetrunken', count: bottles.filter(b => tasted(b) && b.count <= 0).length },
    { id: 'archived', label: 'Archiv',       count: bottles.filter(b => b.archived).length },
  ]
}

const lastTasted = b => {
  const h = b.history || []
  return h.length ? new Date(h[h.length - 1].date).getTime() : 0
}

export function filterMemories(bottles, filter) {
  let arr
  if (filter === 'archived') arr = bottles.filter(b => b.archived)
  else {
    arr = bottles.filter(tasted)
    if (filter === 'loved')   arr = arr.filter(b => (b.rating || 0) >= 4)
    if (filter === 'stocked') arr = arr.filter(b => b.count > 0)
    if (filter === 'empty')   arr = arr.filter(b => b.count <= 0)
  }
  return [...arr].sort((a, b) => ((b.rating || 0) - (a.rating || 0)) || (lastTasted(b) - lastTasted(a)))
}

function fmtAgo(d) {
  if (!d) return ''
  const days = Math.round((Date.now() - new Date(d).getTime()) / 86400000)
  if (days <= 0) return 'heute'
  if (days === 1) return 'gestern'
  if (days < 30) return `vor ${days} Tagen`
  if (days < 365) return `vor ${Math.round(days / 30)} Monaten`
  const y = Math.round(days / 365)
  return `vor ${y} ${y === 1 ? 'Jahr' : 'Jahren'}`
}

export default function CellarDiaryTab({ memories, memoryFilter, onOpen }) {
  if (memories.length === 0) {
    return memoryFilter === 'archived'
      ? <EmptyState icon="boxes" title="Archiv ist leer" text="Archiviere Weine, die du im Tagebuch nicht mehr sehen möchtest." />
      : <EmptyState icon="star" title="Noch keine Einträge" text="Sobald du eine Flasche getrunken oder bewertet hast, taucht sie hier auf." />
  }

  return (
    <ListGroup footer="Sortiert nach Bewertung, dann nach zuletzt getrunken.">
      {memories.map(b => {
        const empty = b.count <= 0
        const last = b.history?.length ? b.history[b.history.length - 1] : null
        const sub = [b.winery, b.vintage, last && `getrunken ${fmtAgo(last.date)}`, last?.occasion].filter(Boolean).join(' · ')
        return (
          <ListRow key={b.id} onClick={() => onOpen(b.id)}
            leading={<WineThumb bottle={b} dim={empty} />}
            title={b.name}
            subtitle={sub}
            trailing={
              <div className="flex flex-col items-end gap-0.5 flex-none">
                {b.rating > 0 && <Stars value={b.rating} size={13} />}
                <span className="text-footnote text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap">
                  {b.restock && <Icon name="cart" size={14} title="Wird nachgekauft" />}
                  {b.archived ? 'Archiviert' : empty ? 'Ausgetrunken' : `${b.count}× im Bestand`}
                </span>
              </div>
            } />
        )
      })}
    </ListGroup>
  )
}
