// Zentrale Einkaufsliste: eingebaute Liste ODER Bring!-Liste, dazu Nachkauf aus TK/Wein/Vorrat und Einräumen-Queue
import { useState, useEffect, useMemo, useCallback } from 'react'
import useStore from '../../store/useStore'
import { useFreezer } from '../freezer/store'
import { useCellar } from '../cellar/store'
import { usePantry } from '../pantry/store'
import FreezerForm from '../freezer/FreezerForm'
import CellarForm from '../cellar/CellarForm'
import { COMMON_SPICES } from '../../data/spices'
import Screen, { BarButton } from '../../ui/Screen'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow } from '../../ui/List'
import { Segmented } from '../../ui/Controls'
import { confirmAction, showToast } from '../../ui/feedback'

const BRING_POLL_MS = 180_000 // alle 3 Minuten
const wineEmoji = c => (c === 'weiß' ? '🥂' : c === 'schaum' ? '🍾' : c === 'rosé' ? '🌸' : '🍷')

export default function UnifiedShoppingList({ onReview }) {
  // Eingebaute Liste (Supabase)
  const items               = useStore(s => s.shoppingItems || [])
  const addShoppingItem     = useStore(s => s.addShoppingItem)
  const toggleShoppingItem  = useStore(s => s.toggleShoppingItem)
  const clearCheckedShopping = useStore(s => s.clearCheckedShopping)
  const pendingInventory    = useStore(s => s.pendingInventory)
  const markPurchased       = useStore(s => s.markPurchased)

  // Bring!
  const bringSettings       = useStore(s => s.bringSettings)
  const bringItems          = useStore(s => s.bringItems)
  const bringItemsError     = useStore(s => s.bringItemsError)
  const loadBringItems      = useStore(s => s.loadBringItems)
  const removeBringItem     = useStore(s => s.removeBringItem)
  const cancelPendingByName = useStore(s => s.cancelPendingByName)
  const bringActive = !!(bringSettings?.listUuid && bringSettings?.accessToken)

  // Module
  const freezerItems   = useFreezer(s => s.items)
  const freezerPending = useFreezer(s => s.pending)
  const markBoughtTK   = useFreezer(s => s.markBought)
  const openTKForm     = useFreezer(s => s.openForm)
  const removeTKPend   = useFreezer(s => s.removePending)
  const tkFormOpen     = useFreezer(s => s.formOpen)
  const tkFormPrefill  = useFreezer(s => s.formPrefill)
  const closeTKForm    = useFreezer(s => s.closeForm)

  const cellarBottles  = useCellar(s => s.bottles)
  const cellarPendingAll = useCellar(s => s.pending)
  const markBoughtWine = useCellar(s => s.markBought)
  const openCellarForm = useCellar(s => s.openForm)
  const removeWnPend   = useCellar(s => s.removePending)
  const wnFormOpen     = useCellar(s => s.formOpen)
  const wnFormPrefill  = useCellar(s => s.formPrefill)
  const closeWnForm    = useCellar(s => s.closeForm)

  const pantryItems    = usePantry(s => s.items)
  const toggleRestock  = usePantry(s => s.toggleRestock)

  const [bringFilter, setBringFilter] = useState('all') // 'spices' | 'all'
  const [bringRefreshing, setBringRefreshing] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showMenu, setShowMenu] = useState(false)

  const cellarPending = useMemo(() => cellarPendingAll.filter(p => p.fromBottleId), [cellarPendingAll])
  const tkRestock = freezerItems.filter(i => i.needsRestock)
  const wnRestock = cellarBottles.filter(b => b.restock)
  const ptRestock = pantryItems.filter(i => i.needsRestock && !i.disposedAt)
  const restockCount = tkRestock.length + wnRestock.length + ptRestock.length
  const openToStore = freezerPending.length + cellarPending.length

  const unchecked = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)

  const bringSpices = bringItems.filter(i => i.specification === 'Gewürz')
  const bringOthers = bringItems.filter(i => i.specification !== 'Gewürz')
  const visibleBring = bringFilter === 'spices' && bringSpices.length ? bringSpices : bringItems

  const listCount = (bringActive ? bringItems.length : 0) + unchecked.length
  const nothingAtAll = listCount + restockCount + openToStore + checked.length === 0

  // Bring!-Artikel laden + pollen, solange der Tab sichtbar ist
  const refresh = useCallback(async () => {
    setBringRefreshing(true)
    await loadBringItems()
    setBringRefreshing(false)
  }, [loadBringItems])

  useEffect(() => {
    if (!bringActive) return
    refresh()
    const id = setInterval(() => { if (!document.hidden) loadBringItems() }, BRING_POLL_MS)
    const onVisible = () => { if (!document.hidden) loadBringItems() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [bringActive]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleBuiltIn(item) {
    // Gewürz mit offenem Nachkauf abgehakt → wartet auf „Einräumen“
    if (!item.checked && pendingInventory.some(p => p.status === 'shopping' && p.name.toLowerCase() === item.name.trim().toLowerCase())) {
      markPurchased(item.name)
    }
    toggleShoppingItem(item.id)
    if (navigator.vibrate) navigator.vibrate(20)
  }

  function bringPurchased(item, isSpice) {
    if (isSpice) markPurchased(item.name, null, null)
    removeBringItem(item.name)
    if (navigator.vibrate) navigator.vibrate(20)
    showToast(isSpice ? `„${item.name}“ gekauft – wartet auf „Einräumen“.` : `„${item.name}“ abgehakt.`,
      isSpice && onReview ? { actionLabel: 'Einräumen', onAction: onReview } : undefined)
  }

  async function bringDiscard(item, isSpice) {
    const ok = await confirmAction({ title: `„${item.name}“ entfernen?`, message: 'Nicht gekauft – nur von der Bring!-Liste nehmen.', confirmLabel: 'Entfernen', destructive: true })
    if (!ok) return
    if (isSpice) cancelPendingByName(item.name)
    removeBringItem(item.name)
  }

  async function clearDone() {
    const ok = await confirmAction({
      title: `${checked.length} erledigte ${checked.length === 1 ? 'Artikel' : 'Artikel'} löschen?`,
      confirmLabel: 'Erledigte löschen', destructive: true,
    })
    if (ok) { clearCheckedShopping(); setShowDone(false) }
  }

  const actions = bringActive
    ? <BarButton icon="more" label="Bring! und Teilen" onClick={() => setShowMenu(true)} />
    : items.length > 0 ? <BarButton icon="share" label="Liste teilen" onClick={() => setShowMenu(true)} /> : null

  return (
    <Screen title="Einkauf" actions={actions}>
      <div className="space-y-5">
        <AddField bringActive={bringActive} onAdd={(name, amount, isSpice) => addShoppingItem(name, amount, isSpice)} />

        {bringActive && bringItemsError && (
          <div role="alert" className="mx-4 bg-expired-soft dark:bg-expired-dark-soft text-expired dark:text-expired-dark rounded-card px-4 py-3">
            <p className="text-callout font-semibold">Bring!-Liste konnte nicht geladen werden</p>
            <p className="text-footnote break-all mt-0.5">{bringItemsError}</p>
          </div>
        )}

        {nothingAtAll && !(bringActive && bringItemsError) && (
          <div className="flex flex-col items-center text-center px-8 py-10 gap-3">
            <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center"><Icon name="cart" size={30} /></span>
            <h3 className="text-headline text-gray-900 dark:text-gray-100">Alles da</h3>
            <p className="text-callout text-gray-500 dark:text-gray-400">
              {bringActive ? 'Deine Bring!-Liste ist leer. Neue Artikel landen direkt dort.' : 'Nichts einzukaufen. Füge oben Artikel hinzu – oder merke sie in Gewürzen, Tiefkühl, Wein und Vorrat zum Nachkaufen vor.'}
            </p>
          </div>
        )}

        {/* ── Einräumen (frisch gekauft, nur noch ablegen) ─────────────── */}
        {openToStore > 0 && (
          <ListGroup title={`Einräumen · ${openToStore}`} footer="Frisch eingekauft – antippen öffnet das vorausgefüllte Formular.">
            {freezerPending.map(p => (
              <ListRow key={p.id}
                onClick={() => openTKForm({ pendingId: p.id, name: p.name, category: p.category, portionSize: p.portionSize, storageId: p.storageId, compartmentId: p.compartmentId, photoData: p.photoData })}
                leading={p.photoData ? <img src={p.photoData} alt="" className="w-9 h-9 rounded-lg object-cover flex-none" /> : <Emoji>❄️</Emoji>}
                title={p.name} subtitle={['Tiefkühl', p.portionSize].filter(Boolean).join(' · ')}
                trailing={<StoreTrailing onRemove={() => removeTKPend(p.id)} name={p.name} />} />
            ))}
            {cellarPending.map(p => (
              <ListRow key={p.id}
                onClick={() => openCellarForm({ pendingId: p.id, fromBottleId: p.fromBottleId,
                  name: p.name, winery: p.winery, vintage: p.vintage, region: p.region, country: p.country,
                  grape: p.grape, color: p.color, alcoholFree: p.alcoholFree,
                  drinkFrom: p.drinkFrom, drinkUntil: p.drinkUntil,
                  rackId: p.rackId, slot: p.slot, photoData: p.photoData })}
                leading={p.photoData ? <img src={p.photoData} alt="" className="w-9 h-9 rounded-lg object-cover flex-none" /> : <Emoji>{wineEmoji(p.color)}</Emoji>}
                title={[p.name, p.vintage].filter(Boolean).join(' ')} subtitle={['Wein', p.winery].filter(Boolean).join(' · ')}
                trailing={<StoreTrailing onRemove={() => removeWnPend(p.id)} name={p.name} />} />
            ))}
          </ListGroup>
        )}

        {/* ── Bring!-Liste ─────────────────────────────────────────────── */}
        {bringActive && bringItems.length > 0 && (
          <>
            {bringSpices.length > 0 && bringOthers.length > 0 && (
              <div className="px-4">
                <Segmented label="Filter" value={bringFilter} onChange={setBringFilter}
                  options={[{ id: 'all', label: `Alle ${bringItems.length}` }, { id: 'spices', label: `Gewürze ${bringSpices.length}` }]} />
              </div>
            )}
            <ListGroup title={`Bring! · ${bringSettings.listName || 'Liste'}`}
              footer="Abhaken = gekauft. Gewürze warten danach unter Bestand auf „Einräumen“.">
              {visibleBring.map(item => {
                const isSpice = item.specification === 'Gewürz'
                return (
                  <ListRow key={item.uuid || item.name}
                    leading={<CheckCircle checked={false} label={`${item.name} abhaken`} onClick={() => bringPurchased(item, isSpice)} />}
                    title={item.name}
                    subtitle={isSpice ? 'Gewürz' : item.specification || null}
                    trailing={
                      <button onClick={() => bringDiscard(item, isSpice)} aria-label={`${item.name} entfernen`}
                        className="w-11 h-11 -mr-2 flex-none flex items-center justify-center text-gray-400">
                        <Icon name="close" size={18} strokeWidth={2.2} />
                      </button>
                    } />
                )
              })}
            </ListGroup>
          </>
        )}

        {/* ── Eingebaute Liste ─────────────────────────────────────────── */}
        {unchecked.length > 0 && (
          <ListGroup title={bringActive ? `In Depot gespeichert · ${unchecked.length}` : `Einkaufsliste · ${unchecked.length}`}>
            {unchecked.map(item => (
              <ListRow key={item.id} onClick={() => setEditing(item)}
                leading={<CheckCircle checked={false} label={`${item.name} abhaken`} onClick={() => toggleBuiltIn(item)} />}
                title={item.name} subtitle={item.amount || null} />
            ))}
          </ListGroup>
        )}

        {/* ── Nachkaufen aus den Beständen ─────────────────────────────── */}
        {restockCount > 0 && (
          <ListGroup title={`Nachkaufen · ${restockCount}`} footer="Abhaken bei Tiefkühl und Wein = gekauft, danach oben unter „Einräumen“.">
            {tkRestock.map(it => (
              <ListRow key={it.id}
                leading={<CheckCircle checked={false} label={`${it.name} gekauft`} onClick={() => { markBoughtTK(it.id); showToast(`„${it.name}“ gekauft – jetzt einräumen.`) }} />}
                title={it.name} subtitle={['Tiefkühl', it.portionSize && `~${it.portionSize}`].filter(Boolean).join(' · ')}
                trailing={it.photoData ? <img src={it.photoData} alt="" className="w-9 h-9 rounded-lg object-cover flex-none" /> : <Emoji>❄️</Emoji>} />
            ))}
            {wnRestock.map(b => (
              <ListRow key={b.id}
                leading={<CheckCircle checked={false} label={`${b.name} gekauft`} onClick={() => { markBoughtWine(b.id); showToast(`„${b.name}“ gekauft – jetzt einräumen.`) }} />}
                title={[b.name, b.vintage].filter(Boolean).join(' ')}
                subtitle={['Wein', b.alcoholFree && 'alkoholfrei', b.winery, b.region, b.priceEur != null && `${b.priceEur.toFixed(2)} €`].filter(Boolean).join(' · ')}
                trailing={b.photoData ? <img src={b.photoData} alt="" className="w-9 h-9 rounded-lg object-cover flex-none" /> : <Emoji>{wineEmoji(b.color)}</Emoji>} />
            ))}
            {ptRestock.map(it => (
              <ListRow key={it.id}
                leading={<CheckCircle checked={false} label={`${it.name} gekauft`} onClick={() => { toggleRestock(it.id); showToast(`„${it.name}“ gekauft.`) }} />}
                title={it.name} subtitle={`Vorrat · ${it.quantity} × ${it.unit}`}
                trailing={it.photoData ? <img src={it.photoData} alt="" className="w-9 h-9 rounded-lg object-cover flex-none" /> : null} />
            ))}
          </ListGroup>
        )}

        {/* ── Erledigt (eingebaute Liste) ──────────────────────────────── */}
        {checked.length > 0 && (
          <ListGroup>
            <ListRow onClick={() => setShowDone(v => !v)} title={`Erledigt (${checked.length})`}
              trailing={<Icon name="chevron" size={18} strokeWidth={2.2} className={`text-gray-400 transition-transform ${showDone ? 'rotate-90' : ''}`} />} />
            {showDone && checked.map(item => (
              <ListRow key={item.id}
                leading={<CheckCircle checked label={`${item.name} wieder offen`} onClick={() => toggleBuiltIn(item)} />}
                title={<span className="line-through text-gray-500 dark:text-gray-400 font-normal">{item.name}</span>}
                subtitle={item.amount || null} />
            ))}
            {showDone && <ListRow onClick={clearDone} tone="danger" title="Erledigte löschen" />}
          </ListGroup>
        )}
      </div>

      {editing && <EditItemSheet item={editing} onClose={() => setEditing(null)} />}

      {showMenu && (
        <MenuSheet bringActive={bringActive} bringSettings={bringSettings} items={items}
          refreshing={bringRefreshing} onRefresh={refresh} onClose={() => setShowMenu(false)} />
      )}

      {/* Einräumen-Formulare auch hier öffnen (Tiefkühl/Wein sind auf diesem Tab nicht gemountet) */}
      {tkFormOpen && <FreezerForm prefilled={tkFormPrefill} onClose={closeTKForm} />}
      {wnFormOpen && <CellarForm prefilled={wnFormPrefill} onClose={closeWnForm} />}
    </Screen>
  )
}

function Emoji({ children }) {
  return <span className="w-9 h-9 flex-none rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[18px]" aria-hidden>{children}</span>
}

// Runder Abhak-Kreis mit 44×44-Tippfläche
function CheckCircle({ checked, onClick, label }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick() }} aria-label={label} aria-pressed={checked}
      className="w-11 h-11 -ml-2.5 -my-1 flex-none flex items-center justify-center">
      <span className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center transition-colors ${
        checked ? 'bg-primary-500 border-primary-500 text-white dark:bg-primary-400 dark:border-primary-400' : 'border-gray-300 dark:border-gray-600'}`}>
        {checked && <Icon name="check" size={15} strokeWidth={3} />}
      </span>
    </button>
  )
}

function StoreTrailing({ onRemove, name }) {
  return (
    <span className="flex items-center flex-none">
      <span className="text-footnote font-semibold text-primary-500 dark:text-primary-300">Einräumen</span>
      <button onClick={e => { e.stopPropagation(); onRemove() }} aria-label={`${name} aus „Einräumen“ entfernen`}
        className="w-11 h-11 -mr-2 flex items-center justify-center text-gray-400">
        <Icon name="close" size={18} strokeWidth={2.2} />
      </button>
    </span>
  )
}

function AddField({ bringActive, onAdd }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [isSpice, setIsSpice] = useState(false)
  const [focused, setFocused] = useState(false)

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase()
    if (!q || isSpice) return []
    return COMMON_SPICES.filter(s => s.toLowerCase().includes(q) && s.toLowerCase() !== q).slice(0, 5)
  }, [name, isSpice])

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name, amount, isSpice)
    showToast(`„${name.trim()}“ ${bringActive ? 'steht auf der Bring!-Liste' : 'hinzugefügt'}.`, { duration: 2500 })
    setName(''); setAmount(''); setIsSpice(false)
  }

  return (
    <div className="px-4">
      <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-card overflow-hidden">
        <div className="flex items-center gap-2 pl-4 pr-1.5 min-h-[52px]">
          <Icon name="plus" size={20} strokeWidth={2.2} className="text-primary-500 dark:text-primary-300" />
          <input type="text" value={name} placeholder="Artikel hinzufügen" aria-label="Artikel hinzufügen" autoComplete="off" enterKeyHint="done"
            onChange={e => { setName(e.target.value); setIsSpice(false) }}
            onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)}
            className="flex-1 min-w-0 bg-transparent outline-none text-body text-gray-900 dark:text-gray-100 placeholder:text-gray-400" />
          {name.trim() && (
            <>
              <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Menge" aria-label="Menge (optional)"
                className="w-20 h-9 px-2 rounded-lg bg-gray-100 dark:bg-gray-700 outline-none text-callout text-gray-900 dark:text-gray-100 placeholder:text-gray-400" />
              <button type="submit" className="min-h-[44px] px-3 text-[17px] font-semibold text-primary-500 dark:text-primary-300">Hinzu</button>
            </>
          )}
        </div>
        {focused && suggestions.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {suggestions.map(s => (
              <button key={s} type="button" onMouseDown={e => e.preventDefault()}
                onClick={() => { setName(s); setIsSpice(true) }}
                className="w-full min-h-[44px] flex items-center gap-3 px-4 text-left text-body text-gray-900 dark:text-gray-100 active:bg-gray-100 dark:active:bg-gray-700">
                <Icon name="leaf" size={18} className="text-gray-400" />{s}
                <span className="ml-auto text-footnote text-gray-500 dark:text-gray-400">Gewürz</span>
              </button>
            ))}
          </div>
        )}
      </form>
      {isSpice && <p className="px-4 pt-1.5 text-footnote text-gray-500 dark:text-gray-400">Als Gewürz markiert – nach dem Einkauf wartet es auf „Einräumen“.</p>}
    </div>
  )
}

function EditItemSheet({ item, onClose }) {
  const updateShoppingItem = useStore(s => s.updateShoppingItem)
  const deleteShoppingItem = useStore(s => s.deleteShoppingItem)
  const [name, setName] = useState(item.name)
  const [amount, setAmount] = useState(item.amount || '')

  function save() {
    if (!name.trim()) return
    updateShoppingItem(item.id, { name: name.trim(), amount: amount.trim() })
    onClose()
  }

  return (
    <Sheet title="Artikel" onClose={onClose} confirmLabel="Sichern" onConfirm={save} confirmDisabled={!name.trim()}>
      <div className="px-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-card p-4 space-y-3">
          <div>
            <label className="label" htmlFor="shop-name">Name</label>
            <input id="shop-name" className="input" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save() }} />
          </div>
          <div>
            <label className="label" htmlFor="shop-amount">Menge</label>
            <input id="shop-amount" className="input" value={amount} placeholder="optional, z. B. 2×" onChange={e => setAmount(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save() }} />
          </div>
        </div>
        <div className="flex justify-center">
          <button onClick={() => { deleteShoppingItem(item.id); onClose(); showToast(`„${item.name}“ entfernt.`) }}
            className="min-h-[44px] px-4 text-callout font-semibold text-expired dark:text-expired-dark">Artikel löschen</button>
        </div>
      </div>
    </Sheet>
  )
}

function shoppingText(items, userName) {
  const date = new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
  return [`Einkaufsliste – ${userName}`, `Stand: ${date}`, '',
    ...items.map(i => `${i.checked ? '[x]' : '[ ]'} ${i.name}${i.amount ? ` (${i.amount})` : ''}`)].join('\n')
}

function MenuSheet({ bringActive, bringSettings, items, refreshing, onRefresh, onClose }) {
  const currentUser = useStore(s => s.currentUser())
  const userName = currentUser?.name ?? 'Benutzer'

  async function share() {
    const text = shoppingText(items, userName)
    if (navigator.share) {
      try { await navigator.share({ title: 'Einkaufsliste', text }) } catch { /* abgebrochen */ }
    } else {
      const { downloadTextFile } = await import('../../utils/export')
      downloadTextFile(text, 'einkaufsliste.txt')
    }
    onClose()
  }
  async function textFile() {
    const { downloadTextFile } = await import('../../utils/export')
    downloadTextFile(shoppingText(items, userName), 'einkaufsliste.txt')
    onClose()
  }
  async function pdf() {
    const { exportShoppingListAsPDF } = await import('../../utils/export')
    exportShoppingListAsPDF(items, userName)
    onClose()
  }

  return (
    <Sheet title={bringActive ? 'Bring!' : 'Liste teilen'} onClose={onClose} cancelLabel="Schließen">
      <div className="space-y-5">
        {bringActive && (
          <ListGroup footer={`Verbunden mit der Liste „${bringSettings.listName || 'Bring!'}“. Neue Artikel gehen direkt dorthin. Verbindung ändern unter Mehr › Einstellungen.`}>
            <ListRow onClick={async () => { await onRefresh(); onClose() }} tone="accent" title={refreshing ? 'Wird aktualisiert …' : 'Jetzt aktualisieren'} />
            <ListRow onClick={() => { window.open('https://web.getbring.com', '_blank', 'noopener'); onClose() }} tone="accent" title="In Bring! öffnen" />
          </ListGroup>
        )}
        {items.length > 0 && (
          <ListGroup title={bringActive ? 'In Depot gespeicherte Liste' : null}>
            <ListRow onClick={share} leading={<Icon name="share" size={20} className="text-primary-500 dark:text-primary-300" />} tone="accent" title="Teilen" />
            <ListRow onClick={textFile} tone="accent" title="Als Textdatei sichern" />
            <ListRow onClick={pdf} tone="accent" title="Als PDF sichern" />
          </ListGroup>
        )}
      </div>
    </Sheet>
  )
}
