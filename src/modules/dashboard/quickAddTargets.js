// „Neu anlegen“ aus der Startseiten-Suche: welche Ziele gibt es, welches steht oben?
import { COMMON_SPICES } from '../../data/spices'
import { autoCategory as freezerCategory } from '../freezer/store'
import { autoCategory as pantryCategory } from '../pantry/store'
import { findGrapes } from '../cellar/wineGuide'

export const TARGETS = [
  { id: 'shopping', label: 'Einkaufsliste', icon: 'cart',   tone: 'accent' },
  { id: 'spice',    label: 'Gewürze',       icon: 'leaf',   tone: 'spices' },
  { id: 'freezer',  label: 'Tiefkühl',      icon: 'snow',   tone: 'freezer' },
  { id: 'cellar',   label: 'Wein',          icon: 'wine',   tone: 'cellar' },
  { id: 'pantry',   label: 'Vorrat',        icon: 'pantry', tone: 'pantry' },
]

const WINE_WORDS = /\b(wein|rotwein|weißwein|weisswein|rosé|sekt|prosecco|champagner|cuvée|cuvee|crémant|cremant)\b/i
const YEAR = /\b(19[5-9]\d|20[0-4]\d)\b/

const norm = s => String(s || '').trim().toLowerCase()
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

// Gleicher Name: genau gleich, oder (ab 4 Zeichen) als ganzes Wort im vorhandenen Namen
function sameName(query, name) {
  const q = norm(query), n = norm(name)
  if (!q || !n) return false
  if (q === n) return true
  return q.length >= 4 && new RegExp(`(^|[^\\p{L}])${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u').test(n)
}

// Wortheuristik ohne vorhandene Einträge; null = kein Hinweis
function guessTarget(name) {
  if (findGrapes(name).length || WINE_WORDS.test(name) || YEAR.test(name)) return 'cellar'
  const n = norm(name)
  if (COMMON_SPICES.some(s => norm(s) === n || norm(s).startsWith(n + ' '))) return 'spice'
  if (freezerCategory(name) !== 'sonstiges') return 'freezer'
  if (pantryCategory(name) !== 'sonstiges') return 'pantry'
  return null
}

const where = {
  spice:   n => (n === 1 ? 'schon bei den Gewürzen' : `schon ${n}× bei den Gewürzen`),
  freezer: n => `schon ${n}× im Tiefkühl`,
  cellar:  n => `schon ${n}× im Weinkeller`,
  pantry:  n => `schon ${n}× im Vorrat`,
}

/**
 * Ziele in der Reihenfolge, in der sie angezeigt werden; das erste ist der Vorschlag.
 * `have` zählt Treffer je Bereich, `onList` sagt, ob der Name schon offen auf der Einkaufsliste steht.
 * Rückgabe: [{ ...TARGET, suggested, hint }]
 */
export function rankTargets(query, { spices, freezerItems, bottles, pantryItems, shoppingItems, modulesEnabled }) {
  const name = cap(query.trim())
  const count = (list, getName) => list.filter(x => sameName(name, getName(x))).length
  const have = {
    spice:   count(spices.filter(s => !s.disposedAt), s => s.name),
    freezer: modulesEnabled ? count(freezerItems, i => i.name) : 0,
    cellar:  modulesEnabled ? count(bottles.filter(b => !b.archived), b => b.name) : 0,
    pantry:  modulesEnabled ? count(pantryItems.filter(i => !i.disposedAt), i => i.name) : 0,
  }
  const onList = shoppingItems.some(i => !i.checked && norm(i.name) === norm(name))

  const active = TARGETS.filter(t => modulesEnabled || t.id === 'shopping' || t.id === 'spice')

  // 1. Name schon vorhanden → dieser Bereich (mit den meisten Treffern)
  let top = null
  const existing = active.filter(t => have[t.id] > 0).sort((a, b) => have[b.id] - have[a.id])
  if (existing.length) top = existing[0].id
  // 2. Wortheuristik, 3. Einkaufsliste
  else {
    const guess = guessTarget(name)
    top = guess && active.some(t => t.id === guess) ? guess : 'shopping'
  }

  const hintFor = t => t.id === 'shopping' ? (onList ? 'steht schon auf der Liste' : 'sofort hinzufügen')
    : have[t.id] > 0 ? where[t.id](have[t.id]) : null

  return [...active.filter(t => t.id === top), ...active.filter(t => t.id !== top)]
    .map(t => ({ ...t, suggested: t.id === top, hint: hintFor(t) }))
}

export { cap as capitalizeName }
