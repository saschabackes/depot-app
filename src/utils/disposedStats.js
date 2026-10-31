// Statistik „Was wir wegwerfen“: aus disposedAt/disposalReason bei Gewürzen und Vorrat
import { localISODate } from './date'
import { disposalLabel } from '../ui/DisposeSheet'

export const PERIODS = [
  { id: '3m',  label: '3 Monate',  months: 3 },
  { id: '12m', label: '12 Monate', months: 12 },
  { id: 'all', label: 'Alles',     months: null },
]

export const AREA_LABEL = { spices: 'Gewürze', pantry: 'Vorrat' }

// Alle entsorgten Einträge beider Bereiche, jüngste zuerst
export function disposedEntries(spices, pantryItems, { withPantry = true } = {}) {
  const entry = area => x => ({ area, id: x.id, name: (x.name || '').trim(), reason: x.disposalReason || '', date: x.disposedAt })
  return [
    ...spices.filter(s => s.disposedAt).map(entry('spices')),
    ...(withPantry ? pantryItems.filter(i => i.disposedAt).map(entry('pantry')) : []),
  ].sort((a, b) => b.date.localeCompare(a.date))
}

// Erster Tag des Zeitraums als YYYY-MM-DD (null = alles)
function cutoff(months, today = new Date()) {
  if (!months) return null
  return localISODate(new Date(today.getFullYear(), today.getMonth() - months, today.getDate()))
}

const TIPS = {
  abgelaufen:  'kleinere Packungen oder früher aufbrauchen?',
  schimmel:    'Lagerort prüfen – trocken und luftig?',
  schaedling:  'Behälter dicht verschließen?',
  beschaedigt: 'beim Einkauf genauer hinschauen?',
  qualitaet:   'vielleicht eine andere Marke probieren?',
}

export function computeStats(entries, periodId) {
  const period = PERIODS.find(p => p.id === periodId) ?? PERIODS[0]
  const from = cutoff(period.months)
  const list = from ? entries.filter(e => e.date >= from) : entries

  const byReason = new Map()
  list.forEach(e => byReason.set(e.reason, (byReason.get(e.reason) ?? 0) + 1))
  const reasons = [...byReason.entries()]
    .map(([id, count]) => ({ id, count, label: id ? disposalLabel(id) : 'Ohne Angabe' }))
    .sort((a, b) => b.count - a.count)

  // Gleicher Name über beide Bereiche zusammen, ohne Groß-/Kleinschreibung; Ziel = jüngster Eintrag
  const byName = new Map()
  list.forEach(e => {
    const key = e.name.toLowerCase()
    const p = byName.get(key)
    if (!p) byName.set(key, { name: e.name, count: 1, areas: new Set([e.area]), latest: e })
    else { p.count += 1; p.areas.add(e.area) }
  })
  const products = [...byName.values()]
    .sort((a, b) => b.count - a.count || b.latest.date.localeCompare(a.latest.date))
    .slice(0, 10)

  // Ein Tipp, nur ab drei Einträgen und nur, wenn für den häufigsten Grund ein Rat passt
  const top = reasons[0]
  const tip = list.length >= 3 && top && TIPS[top.id] ? `Am häufigsten: ${top.label} – ${TIPS[top.id]}` : null

  return {
    total: list.length,
    spices: list.filter(e => e.area === 'spices').length,
    pantry: list.filter(e => e.area === 'pantry').length,
    reasons, products, tip,
  }
}
