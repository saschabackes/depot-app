import { useMemo, useState } from 'react'
import Sheet from '../../ui/Sheet'
import { ListGroup, ListRow } from '../../ui/List'
import { showToast } from '../../ui/feedback'
import { localISODate } from '../../utils/date'
import { usePost } from './store'
import { toSubmit, sumCents, formatEuro, formatDay } from './logic'
import { CheckCircle, Block } from './parts'

// Einreich-Stapel: alle Arztrechnungen, die noch zur privaten Krankenkasse müssen, auf einmal als eingereicht markieren
export default function SubmitSheet({ onClose, onOpenItem }) {
  const items = usePost(s => s.items)
  const persons = usePost(s => s.persons)
  const list = useMemo(() => toSubmit(items, persons).sort((a, b) => (a.receivedOn || '') < (b.receivedOn || '') ? -1 : 1), [items, persons])
  const [off, setOff] = useState(() => new Set())      // abgewählte Rechnungen
  const [date, setDate] = useState(localISODate())

  const chosen = list.filter(it => !off.has(it.id))
  const groups = persons
    .map(p => ({ person: p, rows: list.filter(it => it.personId === p.id) }))
    .filter(g => g.rows.length > 0)

  function toggle(id) {
    setOff(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  function confirm() {
    usePost.getState().submitMany(chosen.map(it => it.id), date)
    showToast(`${chosen.length} ${chosen.length === 1 ? 'Rechnung' : 'Rechnungen'} als eingereicht markiert.`)
    onClose()
  }

  return (
    <Sheet title="Einreichen" onClose={onClose} confirmLabel="Eingereicht" onConfirm={confirm} confirmDisabled={chosen.length === 0}>
      <div className="space-y-5">
        {list.length === 0 && <p className="px-5 text-callout text-gray-500 dark:text-gray-400">Nichts mehr einzureichen.</p>}

        {groups.map(({ person, rows }) => (
          <ListGroup key={person.id} title={person.name}>
            {rows.map(it => (
              <ListRow key={it.id}
                leading={<CheckCircle checked={!off.has(it.id)} onClick={() => toggle(it.id)} label={`${it.sender || 'Rechnung'} auswählen`} />}
                onClick={() => onOpenItem(it.id)}
                title={it.sender || 'Ohne Absender'}
                subtitle={`Erhalten ${formatDay(it.receivedOn)}`}
                trailing={it.amountCents != null ? <span className="text-callout font-semibold text-gray-900 dark:text-gray-100 flex-none">{formatEuro(it.amountCents)}</span> : null} />
            ))}
          </ListGroup>
        ))}

        {chosen.length > 0 && (
          <div className="px-4 space-y-3">
            <Block>
              <p className="text-body font-semibold text-gray-900 dark:text-gray-100">
                {chosen.length} {chosen.length === 1 ? 'Rechnung' : 'Rechnungen'} · {formatEuro(sumCents(chosen))}
              </p>
              <div>
                <label className="label" htmlFor="submit-date">Eingereicht am</label>
                <input id="submit-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
              </div>
            </Block>
            <p className="text-footnote text-gray-500 dark:text-gray-400">
              Reiche die Rechnungen wie gewohnt bei der Krankenkasse ein und tippe danach auf „Eingereicht“. Zum Nachsehen: Rechnung antippen, dann Foto öffnen.
            </p>
          </div>
        )}
      </div>
    </Sheet>
  )
}
