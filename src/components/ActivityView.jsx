import { useEffect } from 'react'
import useStore from '../store/useStore'
import Sheet from '../ui/Sheet'
import Icon from '../ui/Icon'
import { ListGroup } from '../ui/List'

const ACTIONS = {
  spice_added:    { emoji: '🌿', bg: 'bg-green-100 dark:bg-green-900/40',   text: (e) => <>hat <b>{e.target}</b> hinzugefügt</> },
  spice_updated:  { emoji: '✏️', bg: 'bg-blue-100 dark:bg-blue-900/40',     text: (e) => <>hat <b>{e.target}</b> bearbeitet</> },
  spice_deleted:  { emoji: '🗑️', bg: 'bg-red-100 dark:bg-red-900/40',       text: (e) => <>hat <b>{e.target}</b> gelöscht</> },
  fill_changed:   { emoji: '📊', bg: 'bg-amber-100 dark:bg-amber-900/40',   text: (e) => <><b>{e.target}</b> → {e.detail}</> },
  shopping_added: { emoji: '🛒', bg: 'bg-purple-100 dark:bg-purple-900/40', text: (e) => <>hat <b>{e.target}</b> zum Einkauf hinzugefügt</> },
  freezer_added:  { emoji: '❄️', bg: 'bg-sky-100 dark:bg-sky-900/40',       text: (e) => <>hat <b>{e.target}</b> eingefroren{e.detail ? ` (${e.detail})` : ''}</> },
  freezer_consumed:{ emoji: '🍽️', bg: 'bg-sky-100 dark:bg-sky-900/40',      text: (e) => <>hat eine Portion <b>{e.target}</b> verbraucht</> },
  freezer_deleted:{ emoji: '🗑️', bg: 'bg-red-100 dark:bg-red-900/40',       text: (e) => <>hat <b>{e.target}</b> aus dem TK entfernt</> },
  wine_added:     { emoji: '🍷', bg: 'bg-purple-100 dark:bg-purple-900/40', text: (e) => <>hat <b>{e.target}</b> eingelagert{e.detail ? ` (${e.detail})` : ''}</> },
  wine_consumed:  { emoji: '🥂', bg: 'bg-purple-100 dark:bg-purple-900/40', text: (e) => <>hat <b>{e.target}</b> getrunken</> },
  wine_deleted:   { emoji: '🗑️', bg: 'bg-red-100 dark:bg-red-900/40',       text: (e) => <>hat <b>{e.target}</b> aus dem Keller entfernt</> },
  wine_updated:   { emoji: '✏️', bg: 'bg-purple-100 dark:bg-purple-900/40', text: (e) => <>hat <b>{e.target}</b> bearbeitet</> },
}

function initials(name = '') {
  return name.split(' ').map(p => p[0] ?? '').join('').toUpperCase().slice(0, 2) || '?'
}
function timeStr(iso) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}
function dayLabel(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yest = new Date(); yest.setDate(today.getDate() - 1)
  const sameDay = (a, b) => a.toDateString() === b.toDateString()
  if (sameDay(d, today)) return 'Heute'
  if (sameDay(d, yest))  return 'Gestern'
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })
}

export default function ActivityView({ onClose }) {
  const activityLog = useStore(s => s.activityLog)
  const loadActivity = useStore(s => s.loadActivity)

  useEffect(() => { loadActivity() }, [])

  // Nach Tag gruppieren (Reihenfolge bleibt: neueste zuerst)
  const groups = []
  let current = null
  activityLog.forEach(e => {
    const label = dayLabel(e.createdAt)
    if (!current || current.label !== label) {
      current = { label, items: [] }
      groups.push(current)
    }
    current.items.push(e)
  })

  return (
    <Sheet title="Verlauf" onClose={onClose} cancelLabel="Schließen">
      {activityLog.length === 0 ? (
        <div className="flex flex-col items-center text-center px-8 py-14 gap-3">
          <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center"><Icon name="clock" size={30} /></span>
          <h3 className="text-headline text-gray-900 dark:text-gray-100">Noch keine Aktivitäten</h3>
          <p className="text-callout text-gray-500 dark:text-gray-400">Änderungen in allen Bereichen erscheinen hier – mit Name und Uhrzeit.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(group => (
            <ListGroup key={group.label} title={group.label}>
              {group.items.map(e => {
                const a = ACTIONS[e.action] ?? { text: () => e.action }
                return (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 min-h-[50px]">
                    <span className="w-8 h-8 rounded-full flex-none flex items-center justify-center bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-200 text-footnote font-bold">
                      {initials(e.userName)}
                    </span>
                    <p className="flex-1 min-w-0 text-callout text-gray-800 dark:text-gray-200 leading-snug">
                      <span className="font-semibold">{e.userName}</span> {a.text(e)}
                    </p>
                    <span className="flex-none text-footnote text-gray-500 dark:text-gray-400">{timeStr(e.createdAt)}</span>
                  </div>
                )
              })}
            </ListGroup>
          ))}
        </div>
      )}
    </Sheet>
  )
}
