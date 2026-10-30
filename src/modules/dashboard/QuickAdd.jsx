import { useMemo, useRef, useState } from 'react'
import useStore from '../../store/useStore'
import { useFreezer } from '../freezer/store'
import { useCellar } from '../cellar/store'
import { usePantry } from '../pantry/store'
import SpiceForm from '../../components/SpiceForm'
import FreezerForm from '../freezer/FreezerForm'
import CellarForm from '../cellar/CellarForm'
import PantryForm from '../pantry/PantryForm'
import { ListGroup, ListRow, IconTile } from '../../ui/List'
import { StatusPill } from '../../ui/Controls'
import { showToast } from '../../ui/feedback'
import { MODULES_ENABLED } from '../../branding'
import { rankTargets, capitalizeName } from './quickAddTargets'

// Unter den Suchtreffern: den getippten Namen als Neues anlegen – Einkaufsliste sofort,
// alle anderen Ziele über das bestehende Formular des Bereichs (Name schon eingetragen).
export default function QuickAdd({ query, onDone }) {
  const name = capitalizeName(query)
  const spices = useStore(s => s.spices)
  const shoppingItems = useStore(s => s.shoppingItems)
  const addShoppingItem = useStore(s => s.addShoppingItem)
  const freezerItems = useFreezer(s => s.items)
  const bottles = useCellar(s => s.bottles)
  const pantryItems = usePantry(s => s.items)

  const tkOpen = useFreezer(s => s.formOpen)
  const tkPrefill = useFreezer(s => s.formPrefill)
  const wnOpen = useCellar(s => s.formOpen)
  const wnPrefill = useCellar(s => s.formPrefill)
  const ptOpen = usePantry(s => s.formOpen)
  const ptPrefill = usePantry(s => s.formPrefill)
  const [spiceOpen, setSpiceOpen] = useState(false)
  const before = useRef({})

  const targets = useMemo(
    () => rankTargets(query, { spices, freezerItems, bottles, pantryItems, shoppingItems, modulesEnabled: MODULES_ENABLED }),
    [query, spices, freezerItems, bottles, pantryItems, shoppingItems]
  )

  const sizes = () => ({
    spice: useStore.getState().spices.length,
    freezer: useFreezer.getState().items.length,
    cellar: useCellar.getState().bottles.length,
    pantry: usePantry.getState().items.length,
  })

  function start(id) {
    if (id === 'shopping') {
      addShoppingItem(name, '', false)
      showToast(`„${name}“ steht auf der Einkaufsliste.`)
      onDone()
      return
    }
    before.current = sizes()
    if (id === 'spice') setSpiceOpen(true)
    if (id === 'freezer') useFreezer.getState().openForm({ name })
    if (id === 'cellar') useCellar.getState().openForm({ name })
    if (id === 'pantry') usePantry.getState().openForm({ name })
  }

  // Gesichert → Suchfeld leeren; abgebrochen → Text und Ziele bleiben stehen
  function closed(id) {
    if (sizes()[id] > (before.current[id] ?? Infinity)) onDone()
  }

  return (
    <>
      <ListGroup title={`„${name}“ neu anlegen`}>
        {targets.map(t => (
          <ListRow key={t.id} onClick={() => start(t.id)} chevron={t.id !== 'shopping'}
            leading={<IconTile icon={t.icon} tone={t.tone} />}
            title={t.label} subtitle={t.hint}
            trailing={t.suggested ? <StatusPill tone="accent">Vorschlag</StatusPill> : null} />
        ))}
      </ListGroup>

      {spiceOpen && <SpiceForm prefill={{ name }} onClose={() => { setSpiceOpen(false); closed('spice') }} />}
      {tkOpen && <FreezerForm prefilled={tkPrefill} onClose={() => { useFreezer.getState().closeForm(); closed('freezer') }} />}
      {wnOpen && <CellarForm prefilled={wnPrefill} onClose={() => { useCellar.getState().closeForm(); closed('cellar') }} />}
      {ptOpen && <PantryForm prefilled={ptPrefill} onClose={() => { usePantry.getState().closeForm(); closed('pantry') }} />}
    </>
  )
}
