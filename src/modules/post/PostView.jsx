import { useMemo, useState } from 'react'
import Screen, { BarButton } from '../../ui/Screen'
import { ListGroup, ListRow, IconTile } from '../../ui/List'
import { Segmented, StatusPill } from '../../ui/Controls'
import { showToast } from '../../ui/feedback'
import { localISODate } from '../../utils/date'
import { usePost } from './store'
import {
  KINDS, actionsOf, bucketOf, groupTodo, toSubmit, sumCents, formatEuro, formatDay, dueText, toneOf,
} from './logic'
import { CheckCircle } from './parts'
import PostCapture from './PostCapture'
import PostDetail from './PostDetail'
import PostPersons from './PostPersons'
import SubmitSheet from './SubmitSheet'

const ACTION_ICON = { sichten: 'camera', bezahlen: 'tag', einreichen: 'share', warten: 'clock' }

export default function PostView({ onClose, startCapture = false, openId = null }) {
  const items = usePost(s => s.items)
  const persons = usePost(s => s.persons)
  const [tab, setTab] = useState('todo')
  const [capturing, setCapturing] = useState(startCapture)
  const [detailId, setDetailId] = useState(openId)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [personsOpen, setPersonsOpen] = useState(false)

  const today = localISODate()
  const { todo, wait, done } = useMemo(() => {
    const out = { todo: [], wait: [], done: [] }
    for (const item of items) out[bucketOf(item, persons, today)].push(item)
    out.done.sort((a, b) => (b.createdAt || '') < (a.createdAt || '') ? -1 : 1)
    return out
  }, [items, persons, today])

  const groups = useMemo(() => groupTodo(todo, persons, today), [todo, persons, today])
  const submit = useMemo(() => toSubmit(items, persons), [items, persons])
  const waitRows = useMemo(() => wait
    .map(item => ({ item, actions: actionsOf(item, persons, today) }))
    .sort((a, b) => (a.actions[0].days ?? 0) - (b.actions[0].days ?? 0)), [wait, persons, today])

  function paid(item) {
    usePost.getState().markPaid(item.id)
    showToast(`„${item.sender || 'Rechnung'}“ als bezahlt markiert.`, {
      actionLabel: 'Rückgängig', onAction: () => usePost.getState().markUnpaid(item.id),
    })
  }

  function row(item, actions) {
    const primary = actions[0]
    const person = persons.find(p => p.id === item.personId)
    const kind = KINDS.find(k => k.id === item.kind)
    const reimb = actions.find(a => a.type === 'einreichen' || a.type === 'warten')
    const extra = !reimb ? null
      : reimb.type === 'einreichen' ? (primary.type === 'bezahlen' ? 'einreichen' : null)
      : `eingereicht ${formatDay(item.submittedOn)}`
    const subtitle = [item.reviewed ? kind?.label : 'Noch nicht gesichtet', person?.name, extra].filter(Boolean).join(' · ')
    const name = item.sender || (item.reviewed ? 'Ohne Absender' : 'Neuer Brief')
    return (
      <ListRow key={item.id} onClick={() => setDetailId(item.id)}
        leading={primary?.type === 'bezahlen'
          ? <CheckCircle checked={false} onClick={() => paid(item)} label={`${name} als bezahlt markieren`} />
          : <IconTile icon={primary ? ACTION_ICON[primary.type] : 'check'} tone={primary?.urgency === 'overdue' ? 'danger' : primary ? 'accent' : 'gray'} />}
        title={name}
        subtitle={subtitle}
        trailing={
          <span className="flex flex-col items-end gap-1 flex-none">
            {item.amountCents != null && <span className="text-callout font-semibold text-gray-900 dark:text-gray-100">{formatEuro(item.amountCents)}</span>}
            {primary && dueText(primary, item) && <StatusPill tone={toneOf(primary.urgency)}>{dueText(primary, item)}</StatusPill>}
          </span>
        } />
    )
  }

  function doneRow(item) {
    const person = persons.find(p => p.id === item.personId)
    const kind = KINDS.find(k => k.id === item.kind)
    const when = item.reimbStatus === 'erstattet' ? `Erstattet ${formatDay(item.reimbursedOn)}`
      : item.reimbStatus === 'nicht_einreichen' ? 'Nicht eingereicht'
      : item.payStatus === 'bezahlt' ? `Bezahlt ${formatDay(item.paidOn)}`
      : formatDay(item.receivedOn)
    return (
      <ListRow key={item.id} onClick={() => setDetailId(item.id)} leading={<IconTile icon="check" tone="gray" />}
        title={item.sender || 'Ohne Absender'}
        subtitle={[kind?.label, person?.name].filter(Boolean).join(' · ')}
        trailing={
          <span className="flex flex-col items-end gap-0.5 flex-none">
            {item.amountCents != null && <span className="text-callout font-semibold text-gray-900 dark:text-gray-100">{formatEuro(item.amountCents)}</span>}
            <span className="text-footnote text-gray-500 dark:text-gray-400">{when}</span>
          </span>
        } />
    )
  }

  const nothingYet = items.length === 0

  return (
    <>
      <Screen title="Post" back={{ label: 'Zurück', onClick: onClose }}
        actions={<>
          <BarButton icon="user" label="Personen" onClick={() => setPersonsOpen(true)} />
          <BarButton icon="camera" label="Brief erfassen" onClick={() => setCapturing(true)} />
        </>}>
        <div className="space-y-5">
          <div className="px-4">
            <Segmented label="Ansicht" value={tab} onChange={setTab} options={[
              { id: 'todo', label: `Zu tun${todo.length ? ` · ${todo.length}` : ''}` },
              { id: 'wait', label: `Wartet${wait.length ? ` · ${wait.length}` : ''}` },
              { id: 'done', label: 'Erledigt' },
            ]} />
          </div>

          {persons.length === 0 && (
            <ListGroup>
              <ListRow onClick={() => setPersonsOpen(true)} chevron leading={<IconTile icon="user" />}
                title="Wer bekommt Post?" subtitle="Lege Personen an, damit Arztrechnungen richtig zugeordnet werden." />
            </ListGroup>
          )}

          {tab === 'todo' && submit.length > 0 && (
            <ListGroup>
              <ListRow onClick={() => setSubmitOpen(true)} chevron tone="accent" leading={<IconTile icon="share" />}
                title="Bei der Kasse einreichen"
                subtitle={`${submit.length} ${submit.length === 1 ? 'Rechnung' : 'Rechnungen'} · ${formatEuro(sumCents(submit))}`} />
            </ListGroup>
          )}

          {tab === 'todo' && (
            nothingYet ? (
              <ListGroup>
                <ListRow onClick={() => setCapturing(true)} chevron leading={<IconTile icon="camera" />}
                  title="Ersten Brief fotografieren" subtitle="Rechnung oder Arztrechnung – Post erinnert dich an Zahlung und Einreichung." />
              </ListGroup>
            ) : groups.length === 0 ? (
              <ListGroup>
                <ListRow leading={<IconTile icon="check" tone="accent" />} title="Alles erledigt" subtitle="Keine offene Post." />
              </ListGroup>
            ) : groups.map(({ group, rows }) => (
              <ListGroup key={group.id} title={`${group.label} · ${rows.length}`}>
                {rows.map(r => row(r.item, r.actions))}
              </ListGroup>
            ))
          )}

          {tab === 'wait' && (waitRows.length === 0
            ? <ListGroup><ListRow leading={<IconTile icon="clock" tone="gray" />} title="Nichts offen" subtitle="Hier stehen eingereichte Rechnungen, deren Erstattung noch aussteht." /></ListGroup>
            : <ListGroup footer="Nach 28 Tagen ohne Erstattung zeigt Post „Nachfassen“.">{waitRows.map(r => row(r.item, r.actions))}</ListGroup>)}

          {tab === 'done' && (done.length === 0
            ? <ListGroup><ListRow leading={<IconTile icon="check" tone="gray" />} title="Noch nichts erledigt" /></ListGroup>
            : <ListGroup>{done.map(doneRow)}</ListGroup>)}
        </div>
      </Screen>

      {capturing && <PostCapture onClose={() => setCapturing(false)} onOpenItem={id => setDetailId(id)} />}
      {personsOpen && <PostPersons onClose={() => setPersonsOpen(false)} />}
      {submitOpen && <SubmitSheet onClose={() => setSubmitOpen(false)} onOpenItem={id => setDetailId(id)} />}
      {detailId && <PostDetail key={detailId} itemId={detailId} onClose={() => setDetailId(null)} />}
    </>
  )
}
