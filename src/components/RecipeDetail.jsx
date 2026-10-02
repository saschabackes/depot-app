import { useMemo, useState } from 'react'
import useStore from '../store/useStore'
import { useFreezer } from '../modules/freezer/store'
import { useCellar } from '../modules/cellar/store'
import { computeRecipeAvailability } from '../utils/inventoryMatch'
import { isSafeUrl } from '../utils/safeUrl'
import Screen, { BarButton } from '../ui/Screen'
import Icon from '../ui/Icon'
import { ListGroup } from '../ui/List'
import { StatusPill } from '../ui/Controls'
import { confirmAction, showToast } from '../ui/feedback'

const SOURCE_LABELS = { youtube: 'YouTube', cookidoo: 'Cookidoo', kptncook: 'KptnCook', web: 'Web', manual: 'Manuell' }
const ingName = ing => (typeof ing === 'string' ? ing : ing?.name ?? '')

export default function RecipeDetail({ recipe, onBack, onEdit }) {
  const deleteRecipe = useStore(s => s.deleteRecipe)
  const toggleFavorite = useStore(s => s.toggleFavorite)
  const addShoppingItem = useStore(s => s.addShoppingItem)
  const spices = useStore(s => s.spices)
  const locations = useStore(s => s.locations)
  const freezerItems = useFreezer(s => s.items)
  const bottles = useCellar(s => s.bottles)
  const [addedMissing, setAddedMissing] = useState(false)

  const ingredients = recipe.ingredients ?? []
  const steps = recipe.steps ?? []

  // Bestandsabgleich je Zutat: Gewürz / TK / Wein / fehlt / nicht geprüft
  const avail = useMemo(
    () => (ingredients.length ? computeRecipeAvailability(recipe, spices, freezerItems, bottles) : null),
    [recipe, spices, freezerItems, bottles]
  )
  const statusByName = useMemo(() => {
    const map = new Map()
    if (!avail) return map
    avail.spicePlan.matched.forEach(m => map.set(m.recipeName, { kind: 'spice', jar: m.jars[0], count: m.jars.length }))
    avail.freezerMatches.forEach(m => map.set(m.recipeName, { kind: 'freezer', item: m.items[0] }))
    avail.wineMatches.forEach(m => map.set(m.recipeName, { kind: 'wine', bottle: m.bottles[0] }))
    avail.spicePlan.unmatched.forEach(n => { if (!map.has(n)) map.set(n, { kind: 'missing' }) })
    return map
  }, [avail])

  const locName = id => locations.find(l => l.id === id)?.name ?? null
  const missing = avail?.missing ?? []
  const checked = avail ? avail.totalFound + avail.totalMissing : 0

  function addMissingToShopping() {
    missing.forEach(name => addShoppingItem(name, '', true))
    setAddedMissing(true)
    if (navigator.vibrate) navigator.vibrate(30)
    showToast(missing.length === 1 ? '1 Zutat steht auf der Einkaufsliste.' : `${missing.length} Zutaten stehen auf der Einkaufsliste.`)
  }

  async function handleDelete() {
    const ok = await confirmAction({ title: `„${recipe.title}“ löschen?`, message: 'Das Rezept wird für den ganzen Haushalt entfernt.', confirmLabel: 'Löschen', destructive: true })
    if (ok) { deleteRecipe(recipe.id); onBack(); showToast('Rezept gelöscht.') }
  }

  return (
    <Screen title={recipe.title} largeTitle={false} back={{ label: 'Kochen', onClick: onBack }}
      actions={
        <>
          <BarButton label={recipe.favorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'} onClick={() => toggleFavorite(recipe.id)}>
            <Icon name="star" size={24} strokeWidth={2} filled={recipe.favorite} />
          </BarButton>
          <BarButton label="Rezept bearbeiten" onClick={() => onEdit(recipe)}>Bearbeiten</BarButton>
        </>
      }>
      <div className="space-y-6 pt-2">
        {/* Hero */}
        {recipe.videoId ? (
          <div className="px-4">
            <div className="rounded-card overflow-hidden bg-black aspect-video">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${recipe.videoId}`} title={recipe.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            </div>
          </div>
        ) : recipe.thumbnailUrl ? (
          <div className="px-4">
            <div className="rounded-card overflow-hidden bg-white dark:bg-gray-800 aspect-[16/10]">
              <img src={recipe.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        ) : null}

        {/* Titel + Quelle */}
        <div className="px-5 space-y-2">
          <p className="text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {[SOURCE_LABELS[recipe.sourceType || 'manual'], recipe.author].filter(Boolean).join(' · ')}
          </p>
          <h1 className="text-title text-gray-900 dark:text-gray-50 break-words">{recipe.title}</h1>
          {recipe.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {recipe.tags.map(t => <StatusPill key={t}>{t}</StatusPill>)}
            </div>
          )}
          {isSafeUrl(recipe.sourceUrl) && (
            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 min-h-[44px] text-callout font-semibold text-primary-500 dark:text-primary-300">
              Im Original öffnen
              <Icon name="share" size={17} strokeWidth={2} />
            </a>
          )}
        </div>

        {/* Verfügbarkeit + primäre Aktion */}
        {checked > 0 && (
          <div className="px-4 space-y-3">
            <div className="bg-white dark:bg-gray-800 rounded-card px-4 py-3.5">
              <div className="flex items-baseline justify-between">
                <span className="text-body font-semibold text-gray-900 dark:text-gray-100">{avail.totalFound} von {checked} da</span>
                {missing.length > 0 && <span className="text-footnote text-gray-500 dark:text-gray-400">{missing.length} fehlt</span>}
              </div>
              <AvailBar found={avail.totalFound} total={checked} className="mt-2" />
            </div>
            {missing.length > 0 ? (
              <button onClick={addMissingToShopping} disabled={addedMissing} className="btn-primary w-full">
                <Icon name={addedMissing ? 'check' : 'cart'} size={20} />
                {addedMissing ? 'Steht auf der Einkaufsliste' : 'Fehlende auf die Einkaufsliste'}
              </button>
            ) : (
              <p className="px-1 text-footnote text-gray-500 dark:text-gray-400">Alles Nötige ist im Bestand – du kannst loslegen.</p>
            )}
          </div>
        )}

        {/* Zutaten */}
        {ingredients.length > 0 && (
          <ListGroup title={`Zutaten · ${ingredients.length}`}
            footer={avail && checked < ingredients.length ? 'Frische Zutaten und Grundvorräte werden nicht abgeglichen.' : null}>
            {ingredients.map((ing, i) => {
              const name = ingName(ing)
              const st = statusByName.get(name)
              let subtitle = null
              let trailing = null
              if (st?.kind === 'spice') {
                subtitle = [st.jar.brand, locName(st.jar.locationId), st.count > 1 && `${st.count} Packungen`].filter(Boolean).join(' · ') || null
                trailing = <Status label="Da" />
              } else if (st?.kind === 'freezer') {
                subtitle = `TK: ${st.item.name}`
                trailing = <Status label="TK" />
              } else if (st?.kind === 'wine') {
                subtitle = `Keller: ${st.bottle.name}`
                trailing = <Status label="Keller" />
              } else if (st?.kind === 'missing') {
                trailing = <StatusPill tone="soon">Fehlt</StatusPill>
              }
              // eigene Zeile statt ListRow: Zutaten dürfen umbrechen (nicht abschneiden)
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 min-h-[50px]">
                  <div className="flex-1 min-w-0">
                    <div className="text-body text-gray-900 dark:text-gray-100 break-words">{name}</div>
                    {subtitle && <div className="text-footnote text-gray-500 dark:text-gray-400 truncate">{subtitle}</div>}
                  </div>
                  {trailing}
                </div>
              )
            })}
          </ListGroup>
        )}

        {/* Zubereitung */}
        {steps.length > 0 && (
          <section className="px-4">
            <h2 className="px-4 pb-1.5 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Zubereitung</h2>
            <ol className="bg-white dark:bg-gray-800 rounded-card divide-y divide-gray-100 dark:divide-gray-700">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 px-4 py-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-200 text-footnote font-bold flex items-center justify-center">{i + 1}</span>
                  <p className="flex-1 pt-0.5 text-body text-gray-800 dark:text-gray-100 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Notizen */}
        {recipe.notes && (
          <ListGroup title="Notizen">
            <p className="px-4 py-3 text-body text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{recipe.notes}</p>
          </ListGroup>
        )}

        {ingredients.length === 0 && steps.length === 0 && (
          <div className="flex flex-col items-center text-center px-8 py-6 gap-3">
            <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center"><Icon name="list" size={30} /></span>
            <h3 className="text-headline text-gray-900 dark:text-gray-100">Noch keine Zutaten</h3>
            <p className="text-callout text-gray-500 dark:text-gray-400">Ergänze Zutaten und Schritte, dann prüft Depot automatisch deinen Bestand.</p>
            <button onClick={() => onEdit(recipe)} className="btn-primary px-6 mt-1"><Icon name="edit" size={20} />Rezept ergänzen</button>
          </div>
        )}

        <div className="flex justify-center">
          <button onClick={handleDelete} className="min-h-[44px] px-4 text-callout font-semibold text-expired dark:text-expired-dark">Rezept löschen</button>
        </div>
      </div>
    </Screen>
  )
}

function Status({ label }) {
  return (
    <span className="flex items-center gap-1 text-footnote font-semibold text-primary-500 dark:text-primary-300 flex-none">
      <Icon name="check" size={16} strokeWidth={2.6} />{label}
    </span>
  )
}

export function AvailBar({ found, total, className = '' }) {
  const pct = total > 0 ? Math.round((found / total) * 100) : 0
  return (
    <div className={`h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`} role="img" aria-label={`${found} von ${total} Zutaten vorhanden`}>
      <div className="h-full rounded-full bg-primary-500 dark:bg-primary-300" style={{ width: `${pct}%` }} />
    </div>
  )
}
