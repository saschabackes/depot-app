import { useMemo, useState } from 'react'
import useStore from '../store/useStore'
import { useFreezer } from '../modules/freezer/store'
import { useCellar } from '../modules/cellar/store'
import { computeRecipeAvailability } from '../utils/inventoryMatch'
import { getMhdStatus } from '../utils/mhd'
import { FILL_LABELS } from './FillBar'
import Icon from '../ui/Icon'
import { ListGroup, ListRow, IconTile } from '../ui/List'
import { StatusPill } from '../ui/Controls'
import { showToast } from '../ui/feedback'

const mmYYYY = iso => {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
const WINE_LABEL = { rot: 'Rot', 'weiß': 'Weiß' }

// Bestandsabgleich einer Zutatenliste: was ist da (Gewürz/TK/Wein), was fehlt
export default function InventoryCheck({ ingredients }) {
  const spices = useStore(s => s.spices)
  const locations = useStore(s => s.locations)
  const addShoppingItem = useStore(s => s.addShoppingItem)
  const freezerItems = useFreezer(s => s.items)
  const bottles = useCellar(s => s.bottles)

  const [added, setAdded] = useState(new Set())

  const result = useMemo(
    () => computeRecipeAvailability({ ingredients }, spices, freezerItems, bottles),
    [ingredients, spices, freezerItems, bottles]
  )

  const locName = id => locations.find(l => l.id === id)?.name ?? null

  function addMissing(name) {
    addShoppingItem(name, '', true)
    setAdded(a => new Set(a).add(name.toLowerCase()))
    showToast(`„${name}“ steht auf der Einkaufsliste.`)
  }

  function addAllMissing() {
    const open = result.missing.filter(n => !added.has(n.toLowerCase()))
    open.forEach(name => addShoppingItem(name, '', true))
    setAdded(new Set(result.missing.map(n => n.toLowerCase())))
    if (open.length) showToast(open.length === 1 ? '1 Zutat auf die Einkaufsliste gesetzt.' : `${open.length} Zutaten auf die Einkaufsliste gesetzt.`)
  }

  if (result.totalFound === 0 && result.totalMissing === 0) {
    return <p className="px-8 text-footnote text-gray-500 dark:text-gray-400">Keine Zutaten im Bestand erkannt.</p>
  }

  const allAdded = result.missing.every(n => added.has(n.toLowerCase()))

  return (
    <div className="space-y-5">
      {result.totalFound > 0 && (
        <ListGroup title={`Im Bestand · ${result.totalFound}`}>
          {result.spicePlan.matched.map((m, idx) => {
            const jar = m.jars[0]
            const mhd = getMhdStatus(jar.expiryDate)
            const sub = [jar.name !== m.recipeName && jar.name, jar.brand, locName(jar.locationId), FILL_LABELS[jar.fillLevel ?? 4]].filter(Boolean)
            if (m.jars.length > 1) sub.push(`+${m.jars.length - 1} weitere`)
            return (
              <ListRow key={'sp' + idx} leading={<IconTile icon="leaf" tone="spices" size={32} />}
                title={m.recipeName}
                subtitle={(m.jars.length > 1 ? 'Zuerst: ' : '') + sub.join(' · ')}
                trailing={mhd.status === 'expired' ? <StatusPill tone="expired">Abgelaufen</StatusPill>
                  : mhd.status === 'critical' ? <StatusPill tone="soon">Bald weg</StatusPill>
                  : mhd.status !== 'none' ? <span className="text-footnote text-gray-500 dark:text-gray-400">{mmYYYY(jar.expiryDate)}</span>
                  : null} />
            )
          })}
          {result.freezerMatches.map((m, idx) => (
            <ListRow key={'tk' + idx} leading={<IconTile icon="snow" tone="freezer" size={32} />}
              title={m.recipeName}
              subtitle={m.items.map(i => `${i.name} (${i.portions}× ${i.portionSize || 'Portion'})`).join(' · ')}
              trailing={<StatusPill tone="neutral">TK</StatusPill>} />
          ))}
          {result.wineMatches.map((m, idx) => (
            <ListRow key={'wn' + idx} leading={<IconTile icon="wine" tone="cellar" size={32} />}
              title={m.recipeName}
              subtitle={m.bottles.map(b => [b.name, b.vintage].filter(Boolean).join(' ')).join(' · ')}
              trailing={<StatusPill tone="neutral">{WINE_LABEL[m.bottles[0]?.color] ?? 'Rosé'}</StatusPill>} />
          ))}
        </ListGroup>
      )}

      {result.missing.length > 0 && (
        <ListGroup title={`Fehlt · ${result.missing.length}`}>
          {result.missing.map(name => {
            const done = added.has(name.toLowerCase())
            return (
              <ListRow key={name} title={<span className="font-normal">{name}</span>}
                trailing={
                  <button onClick={() => addMissing(name)} disabled={done}
                    aria-label={done ? `${name} steht auf der Einkaufsliste` : `${name} auf die Einkaufsliste`}
                    className={`w-11 h-11 -mr-2 flex items-center justify-center rounded-full ${done ? 'text-gray-400 dark:text-gray-500' : 'text-primary-500 dark:text-primary-300 active:opacity-60'}`}>
                    <Icon name={done ? 'check' : 'cart'} size={22} strokeWidth={done ? 2.4 : 1.9} />
                  </button>
                } />
            )
          })}
          {result.missing.length > 1 && (
            <ListRow tone="accent" onClick={allAdded ? undefined : addAllMissing}
              title={allAdded ? 'Alle auf der Einkaufsliste' : 'Alle auf die Einkaufsliste'}
              className={allAdded ? 'opacity-50' : ''} />
          )}
        </ListGroup>
      )}
    </div>
  )
}
