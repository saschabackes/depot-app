import { useState, useMemo, useRef } from 'react'
import { useFreezer } from './store'
import FreezerForm from './FreezerForm'
import FreezerSetup from './FreezerSetup'
import QuickAddBar from './QuickAddBar'
import StorageSettings from './StorageSettings'
import ExcelImport from './ExcelImport'
import SelectionBar from '../../components/SelectionBar'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow } from '../../ui/List'
import { SearchField, StatusPill, Segmented } from '../../ui/Controls'
import { confirmAction, showToast } from '../../ui/feedback'
import { categoryOf, expiryInfo, expiryClass, portionsText, locationOf, formatDate, ItemThumb, Switch } from './parts'

const STATUS_FILTERS = [
  { id: 'all',     label: 'Alle' },
  { id: 'expired', label: 'Abgelaufen' },
  { id: 'soon',    label: 'Bald' },
  { id: 'restock', label: 'Nachkaufen' },
]

const byExpiry = (a, b) => (a.expiryDate || '9999').localeCompare(b.expiryDate || '9999')

export default function FreezerView() {
  const { storages, items, consumePortion, setupDone, completeSetup, formOpen, formPrefill, openForm, closeForm, bulkDeleteItems } = useFreezer()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('location')
  const [storageFilter, setStorageFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [detailId, setDetailId] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const counts = useMemo(() => ({
    all: items.length,
    expired: items.filter(i => expiryInfo(i).tone === 'expired').length,
    soon: items.filter(i => expiryInfo(i).tone === 'soon').length,
    restock: items.filter(i => i.needsRestock).length,
  }), [items])

  const filtered = useMemo(() => {
    let list = items
    if (status === 'expired') list = list.filter(i => expiryInfo(i).tone === 'expired')
    if (status === 'soon') list = list.filter(i => expiryInfo(i).tone === 'soon')
    if (status === 'restock') list = list.filter(i => i.needsRestock)
    if (storageFilter !== 'all') list = list.filter(i => i.storageId === storageFilter)
    if (category !== 'all') list = list.filter(i => i.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i => i.name.toLowerCase().includes(q) || (i.note ?? '').toLowerCase().includes(q) || categoryOf(i.category).label.toLowerCase().includes(q))
    }
    return list
  }, [items, status, storageFilter, category, search])

  // Nach Gefrierschrank gruppieren (Fach-Reihenfolge, dann Ablauf) – oder eine Liste nach Ablaufdatum
  const groups = useMemo(() => {
    if (sort === 'mhd') return [{ id: 'all', title: 'Nach Ablaufdatum', items: [...filtered].sort(byExpiry) }]
    const byStorage = storages.map(s => {
      const order = Object.fromEntries(s.compartments.map((c, i) => [c.id, i]))
      const list = filtered.filter(i => i.storageId === s.id)
        .sort((a, b) => ((order[a.compartmentId] ?? 999) - (order[b.compartmentId] ?? 999)) || byExpiry(a, b))
      return { id: s.id, title: `${s.emoji} ${s.label}`, items: list }
    })
    const known = new Set(storages.map(s => s.id))
    const rest = filtered.filter(i => !known.has(i.storageId)).sort(byExpiry)
    return [...byStorage, { id: 'none', title: 'Ohne Gefrierschrank', items: rest }].filter(g => g.items.length)
  }, [filtered, storages, sort])

  const totalPortions = items.reduce((s, i) => s + (i.portions || 0), 0)
  const extraFilters = [storageFilter, category].filter(v => v !== 'all').length + (sort === 'mhd' ? 1 : 0)
  const detailItem = detailId ? items.find(i => i.id === detailId) : null
  const editingItem = editingId ? items.find(i => i.id === editingId) : null

  function toggleSelect(id) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  function consume(item) {
    consumePortion(item.id)
    if (navigator.vibrate) navigator.vibrate(20)
    showToast(item.portions <= 1 ? `Letzte Portion „${item.name}“ entnommen – Eintrag entfernt.` : `1 Portion „${item.name}“ entnommen, noch ${item.portions - 1}.`, { duration: 3000 })
  }

  if (!setupDone) {
    return <FreezerSetup onComplete={completeSetup} />
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-gray-50 dark:bg-gray-900">
      <div className="px-4 pt-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <SearchField value={search} onChange={setSearch} placeholder="Tiefkühl durchsuchen" />
          </div>
          <button onClick={() => setShowFilters(true)} aria-label="Filtern und sortieren"
            className="relative w-11 h-11 flex-none rounded-[10px] bg-gray-200/70 dark:bg-gray-700 text-primary-500 dark:text-primary-300 flex items-center justify-center">
            <Icon name="filter" size={22} strokeWidth={2.1} />
            {extraFilters > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary-500 text-white text-[11px] font-bold leading-[18px] text-center">{extraFilters}</span>}
          </button>
          <button onClick={() => setShowSettings(true)} aria-label="Gefrierschränke verwalten"
            className="w-11 h-11 flex-none rounded-[10px] bg-gray-200/70 dark:bg-gray-700 text-primary-500 dark:text-primary-300 flex items-center justify-center">
            <Icon name="settings" size={21} strokeWidth={2} />
          </button>
        </div>
        {items.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {STATUS_FILTERS.filter(f => f.id === 'all' || counts[f.id] > 0 || status === f.id).map(f => {
              const on = status === f.id
              return (
                <button key={f.id} onClick={() => setStatus(f.id)}
                  className={`flex-none min-h-[34px] px-3.5 rounded-full text-[14px] font-semibold ${
                    on ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
                  {f.label} <span className={on ? 'opacity-70' : 'text-gray-500 dark:text-gray-400'}>{counts[f.id]}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="pt-3 pb-28 space-y-5">
        {!selectMode && <QuickAddBar />}

        {items.length === 0 ? (
          <EmptyState hasItems={false} onAdd={() => openForm()} />
        ) : filtered.length === 0 ? (
          <EmptyState hasItems />
        ) : (
          groups.map(g => (
            <ListGroup key={g.id} title={g.title}>
              {g.items.map(item => {
                const exp = expiryInfo(item)
                const { storage, compartment } = locationOf(storages, item)
                const where = sort === 'mhd' ? [storage?.label, compartment?.label].filter(Boolean).join(' · ') : compartment?.label
                return (
                  <SwipeRow key={item.id} disabled={selectMode} onSwipe={() => consume(item)}>
                    <ListRow
                      onClick={() => (selectMode ? toggleSelect(item.id) : setDetailId(item.id))}
                      leading={selectMode
                        ? <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-none ${selected.has(item.id) ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                            {selected.has(item.id) && <Icon name="check" size={14} strokeWidth={3} />}
                          </span>
                        : <ItemThumb item={item} />}
                      title={item.name}
                      subtitle={[portionsText(item), where].filter(Boolean).join(' · ')}
                      trailing={
                        <div className="flex items-center gap-1.5 flex-none">
                          {item.needsRestock && <Icon name="cart" size={17} title="Nachkaufen" className="text-primary-500 dark:text-primary-300" />}
                          {exp.text && <span className={`text-footnote ${expiryClass(exp.tone)}`}>{exp.text}</span>}
                        </div>
                      } />
                  </SwipeRow>
                )
              })}
            </ListGroup>
          ))
        )}

        {items.length > 0 && (
          <p className="px-8 text-center text-footnote text-gray-500 dark:text-gray-400">
            {items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'} · {totalPortions} Portionen · {storages.length} {storages.length === 1 ? 'Gefrierschrank' : 'Gefrierschränke'}
            <br />Nach links wischen entnimmt eine Portion.
          </p>
        )}
      </div>

      {showFilters && (
        <FilterSheet onClose={() => setShowFilters(false)}
          sort={sort} setSort={setSort} storageFilter={storageFilter} setStorageFilter={setStorageFilter}
          category={category} setCategory={setCategory} storages={storages}
          categories={[...new Set(items.map(i => i.category))].map(categoryOf).sort((a, b) => a.label.localeCompare(b.label, 'de'))}
          onSelectMode={() => { setShowFilters(false); setSelectMode(true); setSelected(new Set()) }} />
      )}

      {detailItem && (
        <FreezerDetailSheet item={detailItem} onClose={() => setDetailId(null)} onConsume={() => consume(detailItem)}
          onEdit={() => { setEditingId(detailItem.id); setDetailId(null) }} />
      )}

      {formOpen && <FreezerForm prefilled={formPrefill} onClose={closeForm} />}
      {editingItem && <FreezerForm item={editingItem} onClose={() => setEditingId(null)} />}
      {showSettings && (
        <StorageSettings onClose={() => setShowSettings(false)} onImport={() => { setShowSettings(false); setShowImport(true) }} />
      )}
      {showImport && <ExcelImport onClose={() => setShowImport(false)} />}

      {selectMode && (
        <SelectionBar count={selected.size}
          onDelete={() => { bulkDeleteItems([...selected]); setSelected(new Set()); setSelectMode(false) }}
          onCancel={() => { setSelected(new Set()); setSelectMode(false) }} />
      )}
    </div>
  )
}

// Nach links wischen = eine Portion entnehmen
function SwipeRow({ children, onSwipe, disabled }) {
  const start = useRef(null)
  const moved = useRef(false)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)

  function onTouchStart(e) {
    if (disabled) return
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, horizontal: null }
    moved.current = false
    setDragging(true)
  }
  function onTouchMove(e) {
    const s = start.current
    if (!s) return
    const x = e.touches[0].clientX - s.x
    const y = e.touches[0].clientY - s.y
    if (s.horizontal === null && (Math.abs(x) > 8 || Math.abs(y) > 8)) s.horizontal = Math.abs(x) > Math.abs(y)
    if (!s.horizontal) return
    if (Math.abs(x) > 8) moved.current = true
    setDx(Math.min(0, Math.max(x, -110)))
  }
  function onTouchEnd() {
    if (dx < -70) onSwipe()
    start.current = null
    setDragging(false)
    setDx(0)
  }

  return (
    <div className="relative overflow-hidden"
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}
      onClickCapture={e => { if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false } }}>
      {dx < 0 && (
        <div className={`absolute inset-0 flex items-center justify-end pr-5 gap-1.5 text-callout font-semibold text-white ${dx < -70 ? 'bg-primary-500' : 'bg-primary-300 dark:bg-primary-700'}`}>
          <Icon name="minus" size={18} strokeWidth={2.4} />1 Portion
        </div>
      )}
      <div className="relative bg-white dark:bg-gray-800"
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dragging ? 'none' : 'transform 0.2s' }}>
        {children}
      </div>
    </div>
  )
}

function FreezerDetailSheet({ item, onClose, onConsume, onEdit }) {
  const storages = useFreezer(s => s.storages)
  const toggleRestock = useFreezer(s => s.toggleRestock)
  const removeItem = useFreezer(s => s.removeItem)
  const [zoom, setZoom] = useState(false)

  const exp = expiryInfo(item)
  const cat = categoryOf(item.category)
  const { storage, compartment } = locationOf(storages, item)

  const facts = [
    ['Portionen', String(item.portions)],
    ['Portionsgröße', item.portionSize || '–'],
    ['Eingefroren am', formatDate(item.frozenAt)],
    ['Haltbar bis', formatDate(item.expiryDate)],
  ]

  async function remove() {
    const ok = await confirmAction({ title: `„${item.name}“ löschen?`, message: `Alle ${item.portions} ${item.portions === 1 ? 'Portion' : 'Portionen'} werden entfernt.`, confirmLabel: 'Löschen', destructive: true })
    if (ok) { removeItem(item.id); onClose() }
  }

  function take() {
    const last = item.portions <= 1
    onConsume()
    if (last) onClose()
  }

  return (
    <>
      <Sheet title={item.name} onClose={onClose} cancelLabel="Schließen" confirmLabel="Bearbeiten" onConfirm={onEdit}>
        <div className="space-y-5">
          <div className="px-5 flex items-start gap-4">
            {item.photoData && (
              <button onClick={() => setZoom(true)} aria-label="Foto vergrößern" className="flex-none w-20 h-20 rounded-card bg-white dark:bg-gray-800 overflow-hidden">
                <img src={item.photoData} alt="" className="w-full h-full object-cover" />
              </button>
            )}
            <div className="min-w-0 pt-1">
              <p className="text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{cat.emoji} {cat.label}</p>
              <h3 className="text-title text-gray-900 dark:text-gray-50">{item.name}</h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {exp.tone && <StatusPill tone={exp.tone}>{exp.tone === 'expired' ? `Abgelaufen seit ${-exp.days} ${exp.days === -1 ? 'Tag' : 'Tagen'}` : exp.text}</StatusPill>}
                {item.needsRestock && <StatusPill tone="accent">Nachkaufen</StatusPill>}
              </div>
            </div>
          </div>

          <div className="px-4 grid grid-cols-2 gap-2.5">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-white dark:bg-gray-800 rounded-[14px] px-3.5 py-3">
                <div className="text-footnote text-gray-500 dark:text-gray-400">{k}</div>
                <div className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mt-0.5 break-words">{v}</div>
              </div>
            ))}
            <div className="col-span-2 bg-white dark:bg-gray-800 rounded-[14px] px-3.5 py-3">
              <div className="text-footnote text-gray-500 dark:text-gray-400">Lagerort</div>
              <div className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mt-0.5 break-words">
                {storage ? `${storage.emoji} ${storage.label}${compartment ? ` · ${compartment.label}` : ''}` : 'Ohne Gefrierschrank'}
              </div>
            </div>
          </div>

          <div className="px-4">
            <button onClick={take} className="btn-primary w-full">
              <Icon name="minus" size={20} strokeWidth={2.4} />{item.portions <= 1 ? 'Letzte Portion entnehmen' : 'Portion entnehmen'}
            </button>
          </div>

          <ListGroup footer="Markierte Einträge erscheinen auf der Einkaufsliste.">
            <ListRow
              leading={<Icon name="cart" size={20} className="text-primary-500 dark:text-primary-300" />}
              title="Nachkaufen"
              trailing={<Switch checked={!!item.needsRestock} onChange={() => toggleRestock(item.id)} label="Nachkaufen" />} />
          </ListGroup>

          {item.note && <p className="px-6 text-callout text-gray-600 dark:text-gray-300">{item.note}</p>}

          <div className="flex justify-center">
            <button onClick={remove} className="min-h-[44px] px-4 text-callout font-semibold text-expired dark:text-expired-dark">Eintrag löschen</button>
          </div>
        </div>
      </Sheet>

      {zoom && (
        <div className="fixed inset-0 z-[75] bg-black/85 flex flex-col items-center justify-center p-6 fade-enter" onClick={() => setZoom(false)}>
          <img src={item.photoData} alt={item.name} className="max-w-full max-h-[70vh] object-contain rounded-card" />
          <button className="mt-5 min-h-[44px] px-6 rounded-full bg-white/15 text-white font-semibold">Schließen</button>
        </div>
      )}
    </>
  )
}

function FilterSheet({ onClose, sort, setSort, storageFilter, setStorageFilter, category, setCategory, storages, categories, onSelectMode }) {
  const Option = ({ label, on, onClick }) => (
    <ListRow title={<span className="font-normal">{label}</span>} onClick={onClick}
      trailing={on ? <Icon name="check" size={20} strokeWidth={2.4} className="text-primary-500 dark:text-primary-300" /> : null} />
  )
  const reset = () => { setSort('location'); setStorageFilter('all'); setCategory('all') }
  return (
    <Sheet title="Filtern & sortieren" onClose={onClose} cancelLabel="Schließen" confirmLabel="Fertig" onConfirm={onClose}>
      <div className="space-y-5">
        <div className="px-4">
          <Segmented label="Sortierung" value={sort} onChange={setSort}
            options={[{ id: 'location', label: 'Nach Lagerort' }, { id: 'mhd', label: 'Nach Ablaufdatum' }]} />
        </div>
        {storages.length > 1 && (
          <ListGroup title="Gefrierschrank">
            <Option label="Alle" on={storageFilter === 'all'} onClick={() => setStorageFilter('all')} />
            {storages.map(s => <Option key={s.id} label={`${s.emoji} ${s.label}`} on={storageFilter === s.id} onClick={() => setStorageFilter(s.id)} />)}
          </ListGroup>
        )}
        {categories.length > 1 && (
          <ListGroup title="Kategorie">
            <Option label="Alle" on={category === 'all'} onClick={() => setCategory('all')} />
            {categories.map(c => <Option key={c.id} label={`${c.emoji} ${c.label}`} on={category === c.id} onClick={() => setCategory(c.id)} />)}
          </ListGroup>
        )}
        <ListGroup>
          <ListRow onClick={reset} tone="accent" title="Alle Filter zurücksetzen" />
          <ListRow onClick={onSelectMode} tone="accent" title="Mehrere auswählen …" />
        </ListGroup>
      </div>
    </Sheet>
  )
}

function EmptyState({ hasItems, onAdd }) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-12 gap-3">
      <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center"><Icon name={hasItems ? 'search' : 'snow'} size={30} /></span>
      <h3 className="text-headline text-gray-900 dark:text-gray-100">{hasItems ? 'Nichts gefunden' : 'Noch nichts eingefroren'}</h3>
      <p className="text-callout text-gray-500 dark:text-gray-400">{hasItems ? 'Passe Suche oder Filter an.' : 'Nutze die Schnelleingabe oben oder lege einen Eintrag mit allen Details an.'}</p>
      {!hasItems && <button onClick={onAdd} className="btn-primary px-6 mt-2"><Icon name="plus" size={20} />Eintrag anlegen</button>}
    </div>
  )
}
