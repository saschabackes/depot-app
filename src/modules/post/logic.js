import { localISODate } from '../../utils/date'

// Reine Logik des Post-Moduls: keine React-, keine Supabase-Abhängigkeit.
// Ein Vorgang hat zwei Spuren: Zahlung (payStatus) und – nur bei Arztrechnungen für PKV-Personen – Erstattung (reimbStatus).
// Alles, was die App anzeigt (Listen, Abzeichen, Startseite), leitet sich aus actionsOf() ab.

export const KINDS = [
  { id: 'rechnung',     label: 'Rechnung' },
  { id: 'arztrechnung', label: 'Arztrechnung' },
  { id: 'mahnung',      label: 'Mahnung' },
  { id: 'info',         label: 'Brief ohne Zahlung' },
]

export const INSURANCES = [
  { id: 'pkv',   label: 'Privat versichert' },
  { id: 'gkv',   label: 'Gesetzlich versichert' },
  { id: 'keine', label: 'Keine Erstattung' },
]

export const REIMB_STATES = [
  { id: 'einzureichen',     label: 'Noch einzureichen' },
  { id: 'eingereicht',      label: 'Eingereicht, Erstattung offen' },
  { id: 'erstattet',        label: 'Erstattet' },
  { id: 'nicht_einreichen', label: 'Bewusst nicht einreichen' },
]

export const SOON_DAYS = 5          // „bald fällig“
export const WEEK_DAYS = 7          // Gruppe „Diese Woche“
export const REVIEW_NAG_DAYS = 3    // so lange darf ein Foto ungesichtet bleiben
export const FOLLOW_UP_DAYS = 28    // so lange wartet man auf die Erstattung, dann nachfassen

// ── Datum ────────────────────────────────────────────────────────────────────

function parseDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysBetween(fromISO, toISO) {
  return Math.round((parseDay(toISO) - parseDay(fromISO)) / 86400000)
}

export function addDays(iso, n) {
  const d = parseDay(iso)
  d.setDate(d.getDate() + n)
  return localISODate(d)
}

export function formatDay(iso, withYear = false) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return withYear ? `${d}.${m}.${y}` : `${d}.${m}.`
}

// ── Geld ─────────────────────────────────────────────────────────────────────

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

export function formatEuro(cents) {
  return cents == null ? '' : euro.format(cents / 100)
}

// „84,20“ · „1.234,56“ · „84.20“ → Cent; leer oder ungültig → null
export function parseEuro(text) {
  let s = String(text ?? '').replace(/[€\s]/g, '')
  if (!s) return null
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}

// Cent → Eingabefeld („84,20“)
export function euroInput(cents) {
  return cents == null ? '' : (cents / 100).toFixed(2).replace('.', ',')
}

// ── Zustand eines Vorgangs ───────────────────────────────────────────────────

export function isReimbursable(item, persons) {
  return item.kind === 'arztrechnung' && persons.find(p => p.id === item.personId)?.insurance === 'pkv'
}

// Alles, was bei diesem Vorgang noch zu tun ist oder auf das gewartet wird, wichtigstes zuerst.
// days: Tage bis zum Termin (negativ = überfällig), null = ohne Termin
export function actionsOf(item, persons, today = localISODate()) {
  if (item.archivedAt) return []

  if (!item.reviewed) {
    const age = daysBetween(item.receivedOn || today, today)
    return [{ type: 'sichten', days: REVIEW_NAG_DAYS - age, urgency: age >= REVIEW_NAG_DAYS ? 'overdue' : 'soon' }]
  }

  const out = []
  if (item.payStatus === 'offen' && item.kind !== 'info') {
    const days = item.dueDate ? daysBetween(today, item.dueDate) : null
    out.push({ type: 'bezahlen', days, urgency: days == null ? 'later' : days < 0 ? 'overdue' : days <= SOON_DAYS ? 'soon' : 'later' })
  }
  if (isReimbursable(item, persons)) {
    const state = item.reimbStatus ?? 'einzureichen'
    if (state === 'einzureichen') out.push({ type: 'einreichen', days: null, urgency: 'later' })
    if (state === 'eingereicht') {
      const days = daysBetween(today, addDays(item.submittedOn || today, FOLLOW_UP_DAYS))
      out.push({ type: 'warten', days, urgency: days < 0 ? 'overdue' : 'later' })
    }
  }
  return out
}

// todo = ich muss etwas tun · wait = ich warte auf die Erstattung · done = nichts mehr
export function bucketOf(item, persons, today) {
  const acts = actionsOf(item, persons, today)
  if (acts.some(a => a.type !== 'warten')) return 'todo'
  return acts.length ? 'wait' : 'done'
}

// Gruppen in „Zu tun“, in Anzeigereihenfolge
export const TODO_GROUPS = [
  { id: 'overdue',   label: 'Überfällig' },
  { id: 'sichten',   label: 'Zu sichten' },
  { id: 'week',      label: 'Diese Woche' },
  { id: 'later',     label: 'Später' },
  { id: 'einreichen', label: 'Einzureichen' },
]

function groupOf(action) {
  if (action.type === 'sichten') return action.urgency === 'overdue' ? 'overdue' : 'sichten'
  if (action.type === 'einreichen') return 'einreichen'
  if (action.days == null) return 'later'
  return action.days < 0 ? 'overdue' : action.days <= WEEK_DAYS ? 'week' : 'later'
}

function byDue(a, b) {
  return (a.item.dueDate || '9999') < (b.item.dueDate || '9999') ? -1 : (a.item.dueDate || '9999') > (b.item.dueDate || '9999') ? 1 : 0
}

// → [{ group, rows: [{ item, actions }] }] ohne leere Gruppen
export function groupTodo(items, persons, today = localISODate()) {
  const buckets = Object.fromEntries(TODO_GROUPS.map(g => [g.id, []]))
  for (const item of items) {
    const actions = actionsOf(item, persons, today)
    const primary = actions.find(a => a.type !== 'warten')
    if (!primary) continue
    buckets[groupOf(primary)].push({ item, actions })
  }
  buckets.overdue.sort(byDue)
  buckets.week.sort(byDue)
  buckets.later.sort(byDue)
  buckets.sichten.sort((a, b) => (b.item.receivedOn || '') < (a.item.receivedOn || '') ? -1 : 1)
  buckets.einreichen.sort((a, b) => (a.item.receivedOn || '') < (b.item.receivedOn || '') ? -1 : 1)
  return TODO_GROUPS.map(group => ({ group, rows: buckets[group.id] })).filter(g => g.rows.length > 0)
}

// Arztrechnungen, die noch bei der PKV eingereicht werden müssen (unabhängig davon, ob schon bezahlt)
export function toSubmit(items, persons) {
  return items.filter(it => !it.archivedAt && it.reviewed && isReimbursable(it, persons) && (it.reimbStatus ?? 'einzureichen') === 'einzureichen')
}

export function sumCents(items) {
  return items.reduce((n, it) => n + (it.amountCents ?? 0), 0)
}

// Zahlen für Abzeichen und Startseite
export function summarize(items, persons, today = localISODate()) {
  let overdue = 0, soon = 0, sichten = 0, waitingFollowUp = 0
  for (const item of items) {
    for (const a of actionsOf(item, persons, today)) {
      if (a.type === 'sichten') sichten++
      else if (a.type === 'bezahlen') { if (a.urgency === 'overdue') overdue++; else if (a.urgency === 'soon') soon++ }
      else if (a.type === 'warten' && a.urgency === 'overdue') waitingFollowUp++
    }
  }
  const submit = toSubmit(items, persons)
  return {
    overdue, soon, sichten, waitingFollowUp,
    submitCount: submit.length, submitCents: sumCents(submit),
    badge: overdue + soon + sichten,
  }
}

// ── Anzeige ──────────────────────────────────────────────────────────────────

// Kurzer Fristtext für Zeilen: „3 Tage überfällig“, „Heute fällig“, „Fällig 14.11.“; null = kein Hinweis nötig
export function dueText(action, item) {
  if (action.type === 'sichten') return action.urgency === 'overdue' ? 'Seit Tagen ungesichtet' : 'Neu'
  if (action.type === 'einreichen') return 'Einreichen'
  if (action.type === 'warten') return action.days < 0 ? 'Nachfassen' : null
  if (action.days == null) return 'Ohne Fälligkeit'
  if (action.days < 0) return action.days === -1 ? '1 Tag überfällig' : `${-action.days} Tage überfällig`
  if (action.days === 0) return 'Heute fällig'
  if (action.days === 1) return 'Morgen fällig'
  return `Fällig ${formatDay(item.dueDate)}`
}

export function toneOf(urgency) {
  return urgency === 'overdue' ? 'expired' : urgency === 'soon' ? 'soon' : 'neutral'
}

// Felder, die sich aus Art und Person ergeben (Erstattungsspur nur bei Arztrechnung + PKV; „Brief ohne Zahlung“ braucht keine Zahlung).
// Erstattungsfelder werden nie gelöscht: Wechselt jemand versehentlich die Versicherung, ruhen sie nur und kehren beim Zurückwechseln wieder.
export function consistentPatch(item, persons) {
  const patch = {}
  if (isReimbursable(item, persons) && !item.reimbStatus) patch.reimbStatus = 'einzureichen'
  if (item.kind === 'info' && item.payStatus === 'offen') patch.payStatus = 'entfaellt'
  if (item.kind !== 'info' && item.payStatus === 'entfaellt') patch.payStatus = 'offen'
  return patch
}
