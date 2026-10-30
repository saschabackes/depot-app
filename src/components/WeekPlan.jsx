import { useMemo, useState } from 'react'
import useStore from '../store/useStore'
import { useFreezer } from '../modules/freezer/store'
import { useCellar } from '../modules/cellar/store'
import { useMealPlan, weekDays, plannedOn } from '../store/mealPlanStore'
import { computeRecipeAvailability } from '../utils/inventoryMatch'
import { namesToBuy } from '../utils/shoppingMissing'
import Sheet from '../ui/Sheet'
import Icon from '../ui/Icon'
import { ListGroup, ListRow, IconTile } from '../ui/List'
import { SearchField } from '../ui/Controls'
import { chooseAction, showToast } from '../ui/feedback'
import CookMode from './CookMode'

const dayPhrase = day => (day.label === 'Heute' ? 'heute' : day.label === 'Morgen' ? 'morgen' : day.label)

function Thumb({ recipe, size = 44 }) {
  return recipe.thumbnailUrl
    ? <img src={recipe.thumbnailUrl} alt="" className="rounded-[10px] object-cover flex-none" style={{ width: size, height: size }} loading="lazy" />
    : <IconTile icon="pot" size={size} />
}

// Woche: die nächsten 7 Tage ab heute, je Tag die geplanten Rezepte
export default function WeekPlan({ onOpenRecipe }) {
  const recipes = useStore(s => s.recipes)
  const spices = useStore(s => s.spices)
  const shoppingItems = useStore(s => s.shoppingItems)
  const bringItems = useStore(s => s.bringItems)
  const addShoppingItem = useStore(s => s.addShoppingItem)
  const freezerItems = useFreezer(s => s.items)
  const bottles = useCellar(s => s.bottles)
  const plan = useMealPlan(s => s.plan)
  const remove = useMealPlan(s => s.remove)
  const setServings = useMealPlan(s => s.setServings)

  const days = useMemo(() => weekDays(), [])
  const [pickDay, setPickDay] = useState(null)
  const [servingsFor, setServingsFor] = useState(null)
  const [cooking, setCooking] = useState(null)

  const byDay = useMemo(() => days.map(d => ({ ...d, entries: plannedOn(plan, recipes, d.iso) })), [days, plan, recipes])
  const weekRecipes = useMemo(() => {
    const seen = new Map()
    byDay.forEach(d => d.entries.forEach(e => seen.set(e.recipe.id, e.recipe)))
    return [...seen.values()]
  }, [byDay])

  // Fehlendes aller geplanten Rezepte: jede Zutat nur einmal, nichts, was schon auf der Liste steht
  const toBuy = useMemo(() => {
    const missing = weekRecipes
      .filter(r => r.ingredients?.length)
      .flatMap(r => computeRecipeAvailability(r, spices, freezerItems, bottles).missing)
    return namesToBuy(missing, shoppingItems, bringItems)
  }, [weekRecipes, spices, freezerItems, bottles, shoppingItems, bringItems])

  function addWeekToShopping() {
    toBuy.forEach(name => addShoppingItem(name, '', true))
    if (navigator.vibrate) navigator.vibrate(30)
    showToast(toBuy.length === 1 ? '1 Zutat steht auf der Einkaufsliste.' : `${toBuy.length} Zutaten stehen auf der Einkaufsliste.`)
  }

  async function openActions(entry) {
    const r = entry.recipe
    const options = [
      ...(r.steps?.length ? [{ id: 'cook', label: 'Kochmodus starten' }] : []),
      { id: 'servings', label: 'Portionen ändern' },
      { id: 'remove', label: 'Vom Tag entfernen', destructive: true },
    ]
    const choice = await chooseAction({ title: r.title, options })
    if (choice === 'cook') setCooking(entry)
    else if (choice === 'servings') setServingsFor(entry)
    else if (choice === 'remove') { remove(entry.id); showToast(`„${r.title}“ ist nicht mehr eingeplant.`) }
  }

  const portions = e => e.servings ?? e.recipe.servings ?? null

  return (
    <div className="space-y-5 pb-6">
      {weekRecipes.length > 0 && (
        <div className="px-4">
          {toBuy.length > 0 ? (
            <button onClick={addWeekToShopping} className="btn-primary w-full">
              <Icon name="cart" size={20} />Fehlendes für die Woche auf die Einkaufsliste
            </button>
          ) : (
            <p className="px-4 text-footnote text-gray-500 dark:text-gray-400">
              Für die Woche ist alles Nötige da oder steht schon auf der Einkaufsliste.
            </p>
          )}
        </div>
      )}

      {byDay.map(day => (
        <ListGroup key={day.iso} title={`${day.label} · ${day.date}`}>
          {day.entries.map(e => (
            <ListRow key={e.id} onClick={() => onOpenRecipe(e.recipe.id)}
              leading={<Thumb recipe={e.recipe} />}
              title={e.recipe.title}
              subtitle={portions(e) ? `${portions(e)} ${portions(e) === 1 ? 'Portion' : 'Portionen'}` : null}
              trailing={
                <button onClick={() => openActions(e)} aria-label={`${e.recipe.title}: Optionen`}
                  className="relative z-10 w-11 h-11 -mr-2 flex-none flex items-center justify-center text-gray-400">
                  <Icon name="more" size={22} />
                </button>
              } />
          ))}
          <ListRow onClick={() => setPickDay(day)} tone="accent"
            leading={<span className="w-11 h-11 flex-none flex items-center justify-center text-primary-500 dark:text-primary-300"><Icon name="plus" size={22} strokeWidth={2.2} /></span>}
            title={<span className="font-normal">{day.entries.length ? 'Weiteres Rezept' : 'Rezept wählen'}</span>} />
        </ListGroup>
      ))}

      {pickDay && <PickRecipeSheet day={pickDay} onClose={() => setPickDay(null)} />}
      {servingsFor && (
        <ServingsSheet entry={servingsFor} onClose={() => setServingsFor(null)}
          onSave={n => { setServings(servingsFor.id, n); setServingsFor(null) }} />
      )}
      {cooking && (
        <CookMode recipe={cooking.recipe}
          factor={cooking.recipe.servings && cooking.servings ? cooking.servings / cooking.recipe.servings : 1}
          people={cooking.servings ?? cooking.recipe.servings ?? null}
          onClose={() => setCooking(null)} />
      )}
    </div>
  )
}

// Rezept für einen Tag wählen: Favoriten zuerst, mit Suche
function PickRecipeSheet({ day, onClose }) {
  const recipes = useStore(s => s.recipes)
  const add = useMealPlan(s => s.add)
  const [search, setSearch] = useState('')

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return recipes
      .filter(r => !q || r.title.toLowerCase().includes(q) || (r.tags ?? []).some(t => t.toLowerCase().includes(q)))
      .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.title.localeCompare(b.title, 'de'))
  }, [recipes, search])

  function pick(r) {
    if (add(day.iso, r.id)) showToast(`„${r.title}“ ist für ${dayPhrase(day)} eingeplant.`)
    else showToast(`„${r.title}“ steht für ${dayPhrase(day)} schon im Plan.`)
    onClose()
  }

  return (
    <Sheet title={`${day.label} · ${day.date}`} onClose={onClose} cancelLabel="Schließen">
      <div className="space-y-3">
        <div className="px-4"><SearchField value={search} onChange={setSearch} placeholder="Rezepte durchsuchen" /></div>
        {list.length === 0 ? (
          <p className="px-8 py-6 text-center text-callout text-gray-500 dark:text-gray-400">Nichts gefunden.</p>
        ) : (
          <ListGroup>
            {list.map(r => (
              <ListRow key={r.id} onClick={() => pick(r)} leading={<Thumb recipe={r} size={40} />} title={r.title}
                trailing={r.favorite ? <Icon name="star" size={18} strokeWidth={2} filled className="text-soon dark:text-soon-dark" /> : null} />
            ))}
          </ListGroup>
        )}
      </div>
    </Sheet>
  )
}

// Tag wählen, an dem ein Rezept gekocht werden soll (aus dem Rezeptdetail)
export function PlanDaySheet({ recipe, servings = null, onClose }) {
  const plan = useMealPlan(s => s.plan)
  const add = useMealPlan(s => s.add)
  const days = useMemo(() => weekDays(), [])

  function pick(day) {
    if (add(day.iso, recipe.id, servings)) showToast(`„${recipe.title}“ ist für ${dayPhrase(day)} eingeplant.`)
    else showToast(`„${recipe.title}“ steht für ${dayPhrase(day)} schon im Plan.`)
    onClose()
  }

  return (
    <Sheet title="Einplanen" onClose={onClose} cancelLabel="Schließen">
      <ListGroup title="Für welchen Tag?">
        {days.map(d => (
          <ListRow key={d.iso} onClick={() => pick(d)} title={<span className="font-normal">{d.label}</span>} subtitle={d.date}
            trailing={plan.some(p => p.date === d.iso && p.recipeId === recipe.id)
              ? <Icon name="check" size={20} strokeWidth={2.4} className="text-primary-500 dark:text-primary-300" /> : null} />
        ))}
      </ListGroup>
    </Sheet>
  )
}

function ServingsSheet({ entry, onClose, onSave }) {
  const [n, setN] = useState(entry.servings ?? entry.recipe.servings ?? 4)
  const step = d => setN(v => Math.min(50, Math.max(1, v + d)))
  return (
    <Sheet title="Portionen" onClose={onClose} cancelLabel="Abbrechen" confirmLabel="Fertig" onConfirm={() => onSave(n)}>
      <div className="px-4 space-y-3">
        <p className="px-1 text-callout text-gray-500 dark:text-gray-400 truncate">{entry.recipe.title}</p>
        <div className="bg-white dark:bg-gray-800 rounded-card px-4 py-2.5 flex items-center justify-between">
          <span className="text-body font-semibold text-gray-900 dark:text-gray-100">{n === 1 ? 'Person' : 'Personen'}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => step(-1)} disabled={n <= 1} aria-label="Eine Person weniger"
              className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center justify-center disabled:opacity-40">
              <Icon name="minus" size={20} strokeWidth={2.4} />
            </button>
            <span className="w-12 text-center text-headline text-gray-900 dark:text-gray-50" aria-live="polite">{n}</span>
            <button onClick={() => step(1)} disabled={n >= 50} aria-label="Eine Person mehr"
              className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center justify-center disabled:opacity-40">
              <Icon name="plus" size={20} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
