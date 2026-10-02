import { useState, useMemo, useEffect } from 'react'
import { usePantry, CATEGORIES } from './store'
import PantryForm from './PantryForm'
import PantrySetup from './PantrySetup'
import QRLabel from './QRLabel'
import SelectionBar from '../../components/SelectionBar'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow } from '../../ui/List'
import { SearchField, StatusPill, Segmented } from '../../ui/Controls'
import DisposeSheet, { disposalLabel } from '../../ui/DisposeSheet'
import { confirmAction, showToast } from '../../ui/feedback'

const APP_URL = typeof window !== 'undefined' ? window.location.origin : ''

const STATUS_FILTERS = [
  { id: 'all',     label: 'Alle' },
  { id: 'expired', label: 'Abgelaufen' },
  { id: 'soon',    label: 'Bald' },
  { id: 'restock', label: 'Nachkaufen' },
]

// Tage bis zum MHD, gerechnet in lokalen Kalendertagen
function daysUntil(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const target = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target - today) / 86400000)
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = String(dateStr).slice(0, 10).split('-')
  return d && m && y ? `${d}.${m}.${y}` : dateStr
}

// Status für Liste (kurz) und Detail (Pille)
function expiryInfo(item) {
  const d = daysUntil(item.bestBefore)
  if (d === null) return { tone: null, text: '', pill: null }
  const [y, m] = String(item.bestBefore).split('-')
  if (d < 0) return {
    tone: 'expired',
    text: `Seit ${formatDate(item.bestBefore).slice(0, 6)}`,
    pill: d === -1 ? 'Seit gestern abgelaufen' : `Seit ${-d} Tagen abgelaufen`,
  }
  if (d <= 14) return {
    tone: 'soon',
    text: d === 0 ? 'Läuft heute ab' : d === 1 ? 'Noch 1 Tag' : `Noch ${d} Tage`,
    pill: d === 0 ? 'MHD heute' : d === 1 ? 'MHD morgen' : `MHD in ${d} Tagen`,
  }
  return { tone: null, text: `MHD ${m}/${y}`, pill: d <= 60 ? `MHD in ${d} Tagen` : `MHD ${m}/${y}` }
}

const category = id => CATEGORIES.find(c => c.id === id)

export default function PantryView({ focusId = null, onFocusHandled = () => {} }) {
  const { locations, items, removeItem, setupDone, completeSetup, restartSetup,
    formOpen, formPrefill, openForm, closeForm, bulkDeleteItems } = usePantry()
  const loaded = usePantry(s => s._loaded)
  const [focusNotFound, setFocusNotFound] = useState(false)
  const [tab, setTab] = useState('bestand')
  const [activeLocationId, setActiveLocationId] = useState(locations[0]?.id)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [sort, setSort] = useState('name')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [detailId, setDetailId] = useState(null)

  const activeItems = useMemo(() => items.filter(it => !it.disposedAt), [items])
  const disposedItems = useMemo(() => items.filter(it => !!it.disposedAt).sort((a, b) => b.disposedAt.localeCompare(a.disposedAt)), [items])

  const activeLocation = locations.find(l => l.id === activeLocationId) || locations[0]
  const shelvesOfActive = activeLocation?.shelves || []

  const counts = useMemo(() => ({
    all: activeItems.length,
    expired: activeItems.filter(it => expiryInfo(it).tone === 'expired').length,
    soon: activeItems.filter(it => expiryInfo(it).tone === 'soon').length,
    restock: activeItems.filter(it => it.needsRestock).length,
  }), [activeItems])

  const filtered = useMemo(() => {
    let list = activeItems
    if (status === 'expired') list = list.filter(it => expiryInfo(it).tone === 'expired')
    if (status === 'soon') list = list.filter(it => expiryInfo(it).tone === 'soon')
    if (status === 'restock') list = list.filter(it => it.needsRestock)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(it => it.name.toLowerCase().includes(q) || (it.note ?? '').toLowerCase().includes(q))
    }
    return [...list].sort(sort === 'mhd'
      ? (a, b) => (a.bestBefore || '9999').localeCompare(b.bestBefore || '9999')
      : (a, b) => a.name.localeCompare(b.name, 'de'))
  }, [activeItems, status, search, sort])

  // Bestand: nach Lagerort (Standard), nach Kategorie oder eine Liste nach MHD
  const groups = useMemo(() => {
    if (sort === 'mhd') return [{ id: 'all', title: 'Nach Ablaufdatum', items: filtered }]
    if (sort === 'category') {
      return CATEGORIES.map(c => ({ id: c.id, title: `${c.emoji} ${c.label}`, items: filtered.filter(it => it.category === c.id) }))
        .concat([{ id: '_other', title: 'Sonstige', items: filtered.filter(it => !category(it.category)) }])
        .filter(g => g.items.length)
    }
    const byLoc = locations.map(l => ({ id: l.id, title: `${l.emoji} ${l.label}`, items: filtered.filter(it => it.locationId === l.id) }))
    const known = new Set(locations.map(l => l.id))
    const rest = filtered.filter(it => !it.locationId || !known.has(it.locationId))
    return [...byLoc, { id: 'none', title: locations.length ? 'Ohne Lagerort' : null, items: rest }].filter(g => g.items.length)
  }, [filtered, locations, sort])

  // Lager: Fächer des gewählten Lagerorts
  const byShelf = useMemo(() => {
    const map = Object.fromEntries(shelvesOfActive.map(sh => [sh.id, []]))
    const orphan = []
    activeItems.filter(it => it.locationId === activeLocation?.id).forEach(it => {
      if (map[it.shelfId]) map[it.shelfId].push(it); else orphan.push(it)
    })
    Object.values(map).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, 'de')))
    orphan.sort((a, b) => a.name.localeCompare(b.name, 'de'))
    return { map, orphan }
  }, [shelvesOfActive, activeItems, activeLocation])

  const detailItem = detailId ? items.find(it => it.id === detailId) : null

  // QR-Deep-Link: Eintrag direkt im Detail öffnen
  useEffect(() => {
    if (!focusId || !loaded) return
    const item = items.find(it => it.id === focusId)
    if (item) {
      setTab(item.disposedAt ? 'entsorgt' : 'bestand')
      setDetailId(item.id)
    } else {
      setFocusNotFound(true)
    }
    onFocusHandled()
  }, [focusId, loaded, items])

  if (!setupDone) {
    return <PantrySetup onComplete={completeSetup} />
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function shelfLabel(item) {
    const loc = locations.find(l => l.id === item.locationId)
    return loc?.shelves.find(sh => sh.id === item.shelfId)?.label
  }

  function itemRow(item, { showShelf = true } = {}) {
    const exp = expiryInfo(item)
    return (
      <ListRow key={item.id}
        onClick={() => (selectMode ? toggleSelect(item.id) : setDetailId(item.id))}
        leading={selectMode
          ? <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-none ${selected.has(item.id) ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
              {selected.has(item.id) && <Icon name="check" size={14} strokeWidth={3} />}
            </span>
          : item.photoData ? <img src={item.photoData} alt="" className="w-9 h-9 rounded-lg object-cover flex-none" /> : null}
        title={item.name}
        subtitle={[`${item.quantity} × ${item.unit}`, showShelf && shelfLabel(item)].filter(Boolean).join(' · ')}
        trailing={item.needsRestock
          ? <StatusPill tone="soon">Nachkaufen</StatusPill>
          : exp.text ? <span className={`flex-none text-footnote ${exp.tone === 'expired' ? 'font-semibold text-expired dark:text-expired-dark' : exp.tone === 'soon' ? 'font-semibold text-soon dark:text-soon-dark' : 'text-gray-500 dark:text-gray-400'}`}>{exp.text}</span> : null} />
    )
  }

  const tabs = [
    { id: 'bestand', label: 'Bestand' },
    { id: 'lager', label: 'Lager' },
    { id: 'entsorgt', label: disposedItems.length ? `Entsorgt (${disposedItems.length})` : 'Entsorgt' },
  ]
  const extraFilters = sort !== 'name' ? 1 : 0

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-gray-50 dark:bg-gray-900">
      <div className="px-4 pt-3 space-y-2.5">
        <Segmented label="Ansicht" value={tab} onChange={t => { setTab(t); setSelectMode(false); setSelected(new Set()) }} options={tabs} />

        {focusNotFound && (
          <div role="alert" className="bg-soon-soft dark:bg-soon-dark-soft text-soon dark:text-soon-dark rounded-card pl-4 pr-1 py-1 flex items-center gap-2">
            <span className="flex-1 text-callout py-2">Zu diesem QR-Etikett gibt es keinen Eintrag mehr – vermutlich wurde er gelöscht.</span>
            <button onClick={() => setFocusNotFound(false)} aria-label="Hinweis schließen" className="w-11 h-11 flex-none flex items-center justify-center">
              <Icon name="close" size={18} strokeWidth={2.2} />
            </button>
          </div>
        )}

        {tab === 'bestand' && activeItems.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <SearchField value={search} onChange={setSearch} placeholder="Vorrat durchsuchen" />
              </div>
              <button onClick={() => setShowFilters(true)} aria-label="Sortieren und mehr"
                className="relative w-11 h-11 flex-none rounded-[10px] bg-gray-200/70 dark:bg-gray-700 text-primary-500 dark:text-primary-300 flex items-center justify-center">
                <Icon name="filter" size={22} strokeWidth={2.1} />
                {extraFilters > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary-500 text-white text-[11px] font-bold leading-[18px] text-center">{extraFilters}</span>}
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              {STATUS_FILTERS.filter(f => f.id === 'all' || counts[f.id] > 0).map(f => {
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
          </>
        )}

        {tab === 'lager' && locations.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {locations.map(l => {
              const on = activeLocation?.id === l.id
              return (
                <button key={l.id} onClick={() => setActiveLocationId(l.id)}
                  className={`flex-none min-h-[34px] px-3.5 rounded-full text-[14px] font-semibold ${
                    on ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
                  {l.emoji} {l.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="pt-3 pb-28 space-y-5">
        {tab === 'bestand' && (
          activeItems.length === 0 ? (
            <EmptyState icon="pantry" title="Noch keine Vorräte" text="Erfasse Mehl, Nudeln, Konserven & Co. – mit MHD und QR-Etikett."
              action={<button onClick={() => openForm()} className="btn-primary px-6 mt-2"><Icon name="plus" size={20} />Vorrat hinzufügen</button>} />
          ) : filtered.length === 0 ? (
            <EmptyState icon="search" title="Nichts gefunden" text="Passe Suche oder Filter an." />
          ) : (
            groups.map(g => (
              <ListGroup key={g.id} title={g.title}>
                {g.items.map(item => itemRow(item))}
              </ListGroup>
            ))
          )
        )}

        {tab === 'lager' && (
          !activeLocation ? (
            <EmptyState icon="pantry" title="Noch keine Lagerorte" text="Lege Schränke und Fächer an, um deine Vorräte zu ordnen."
              action={<button onClick={restartSetup} className="btn-primary px-6 mt-2">Lagerorte anlegen</button>} />
          ) : (
            <>
              {shelvesOfActive.map(shelf => {
                const shelfItems = byShelf.map[shelf.id] || []
                return (
                  <ListGroup key={shelf.id} title={`${shelf.label} · ${shelfItems.length}`}>
                    {shelfItems.map(item => itemRow(item, { showShelf: false }))}
                    <ListRow onClick={() => openForm({ locationId: activeLocation.id, shelfId: shelf.id })} tone="accent"
                      leading={<Icon name="plus" size={20} strokeWidth={2.2} className="text-primary-500 dark:text-primary-300" />}
                      title={shelfItems.length ? 'Hier hinzufügen' : 'Vorrat hinzufügen'} />
                  </ListGroup>
                )
              })}
              {byShelf.orphan.length > 0 && (
                <ListGroup title="Ohne Fach">
                  {byShelf.orphan.map(item => itemRow(item, { showShelf: false }))}
                </ListGroup>
              )}
            </>
          )
        )}

        {tab === 'entsorgt' && (
          disposedItems.length === 0 ? (
            <EmptyState icon="trash" title="Nichts entsorgt" text="Entsorgte Vorräte erscheinen hier mit Grund und Datum." />
          ) : (
            <ListGroup footer="Entsorgte Einträge bleiben als Verlauf erhalten, bis du sie endgültig löschst.">
              {disposedItems.map(item => (
                <ListRow key={item.id} onClick={() => setDetailId(item.id)}
                  title={<span className="line-through text-gray-500 dark:text-gray-400">{item.name}</span>}
                  subtitle={`${disposalLabel(item.disposalReason) || 'Entsorgt'} · ${new Date(item.disposedAt).toLocaleDateString('de-DE')}`}
                  trailing={
                    <button onClick={async e => {
                      e.stopPropagation()
                      if (await confirmAction({ title: `„${item.name}“ endgültig löschen?`, confirmLabel: 'Löschen', destructive: true })) removeItem(item.id)
                    }} aria-label={`${item.name} endgültig löschen`} className="w-11 h-11 -mr-2 flex-none flex items-center justify-center text-gray-400">
                      <Icon name="trash" size={20} />
                    </button>
                  } />
              ))}
            </ListGroup>
          )
        )}
      </div>

      {showFilters && (
        <FilterSheet sort={sort} setSort={setSort} onClose={() => setShowFilters(false)}
          onSelectMode={() => { setShowFilters(false); setSelectMode(true); setSelected(new Set()) }}
          onEditLocations={() => { setShowFilters(false); restartSetup() }} />
      )}

      {detailItem && (
        <PantryDetailSheet item={detailItem} onClose={() => setDetailId(null)}
          onEdit={() => { setDetailId(null); openForm({ ...detailItem }) }} />
      )}

      {selectMode && (
        <SelectionBar count={selected.size}
          onDelete={() => { bulkDeleteItems([...selected]); setSelected(new Set()); setSelectMode(false) }}
          onCancel={() => { setSelected(new Set()); setSelectMode(false) }} />
      )}

      {formOpen && <PantryForm prefilled={formPrefill} onClose={closeForm} />}
    </div>
  )
}

function PantryDetailSheet({ item, onClose, onEdit }) {
  const locations = usePantry(s => s.locations)
  const toggleRestock = usePantry(s => s.toggleRestock)
  const disposeItem = usePantry(s => s.disposeItem)
  const removeItem = usePantry(s => s.removeItem)
  const [disposing, setDisposing] = useState(false)
  const [zoom, setZoom] = useState(false)

  const cat = category(item.category)
  const loc = locations.find(l => l.id === item.locationId)
  const shelf = loc?.shelves.find(sh => sh.id === item.shelfId)
  const exp = expiryInfo(item)
  const disposed = !!item.disposedAt

  function restock() {
    const on = !item.needsRestock
    toggleRestock(item.id)
    if (navigator.vibrate) navigator.vibrate(30)
    showToast(on ? `„${item.name}“ ist zum Nachkaufen vorgemerkt.` : `„${item.name}“ nicht mehr vorgemerkt.`)
  }

  async function remove() {
    const ok = await confirmAction({
      title: `„${item.name}“ löschen?`,
      message: disposed ? 'Der Eintrag verschwindet auch aus dem Verlauf.' : 'Zum Aussortieren mit Grund lieber „Entsorgen“ nutzen.',
      confirmLabel: 'Löschen', destructive: true,
    })
    if (ok) { removeItem(item.id); onClose() }
  }

  return (
    <>
      <Sheet title={item.name} onClose={onClose} cancelLabel="Schließen" confirmLabel={disposed ? undefined : 'Bearbeiten'} onConfirm={onEdit}>
        <div className="space-y-5">
          <div className="px-5 flex items-start gap-4">
            {item.photoData && (
              <button onClick={() => setZoom(true)} aria-label="Bild vergrößern" className="flex-none w-20 h-20 rounded-card bg-white dark:bg-gray-800 overflow-hidden">
                <img src={item.photoData} alt="" className="w-full h-full object-cover" />
              </button>
            )}
            <div className="min-w-0 pt-1">
              {cat && <p className="text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{cat.emoji} {cat.label}</p>}
              <h3 className="text-title text-gray-900 dark:text-gray-50 break-words">{item.name}</h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {disposed
                  ? <StatusPill tone="expired">Entsorgt · {disposalLabel(item.disposalReason) || 'ohne Grund'}</StatusPill>
                  : exp.pill && <StatusPill tone={exp.tone ?? 'neutral'}>{exp.pill}</StatusPill>}
                {!disposed && item.needsRestock && <StatusPill tone="soon">Nachkaufen</StatusPill>}
              </div>
            </div>
          </div>

          <div className="px-4 grid grid-cols-2 gap-2.5">
            <Fact label="Menge" value={`${item.quantity} × ${item.unit}`} />
            <Fact label="Haltbar bis" value={formatDate(item.bestBefore) ?? '–'} />
            <Fact wide label="Lagerort · Fach" value={loc ? `${loc.emoji} ${loc.label}${shelf ? ` · ${shelf.label}` : ''}` : 'Ohne Lagerort'} />
            {item.openedAt && <Fact wide label="Geöffnet am" value={formatDate(item.openedAt)} />}
          </div>

          <div className="px-4 grid grid-cols-2 gap-2.5">
            <button onClick={restock} aria-pressed={!!item.needsRestock} className="btn-primary w-full">
              <Icon name={item.needsRestock ? 'check' : 'cart'} size={20} />{item.needsRestock ? 'Vorgemerkt' : 'Nachkaufen'}
            </button>
            <QRLabel item={item} appUrl={APP_URL} label="Etikett" />
          </div>

          {!disposed && (
            <ListGroup>
              <ListRow onClick={() => setDisposing(true)} leading={<Icon name="trash" size={20} className="text-soon dark:text-soon-dark" />}
                title={<span className="text-soon dark:text-soon-dark">Entsorgen …</span>} trailing={<span className="text-footnote text-gray-500 dark:text-gray-400">mit Grund</span>} />
            </ListGroup>
          )}

          {item.note && <p className="px-6 text-callout text-gray-600 dark:text-gray-300">{item.note}</p>}
          {item.barcode && <p className="px-6 text-footnote text-gray-500 dark:text-gray-400">Barcode {item.barcode}</p>}

          <div className="flex justify-center">
            <button onClick={remove} className="min-h-[44px] px-4 text-callout font-semibold text-expired dark:text-expired-dark">Eintrag löschen</button>
          </div>
        </div>
      </Sheet>

      {disposing && (
        <DisposeSheet name={item.name} onClose={() => setDisposing(false)}
          onPick={reason => { disposeItem(item.id, reason); setDisposing(false); onClose(); showToast(`„${item.name}“ wurde entsorgt.`) }} />
      )}

      {zoom && (
        <div className="fixed inset-0 z-[75] bg-black/85 flex flex-col items-center justify-center p-6 fade-enter" onClick={() => setZoom(false)}>
          <img src={item.photoData} alt={item.name} className="max-w-full max-h-[70vh] object-contain rounded-card" />
          <button className="mt-5 min-h-[44px] px-6 rounded-full bg-white/15 text-white font-semibold">Schließen</button>
        </div>
      )}
    </>
  )
}

function Fact({ label, value, wide = false }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-[14px] px-3.5 py-3 ${wide ? 'col-span-2' : ''}`}>
      <div className="text-footnote text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mt-0.5 break-words">{value}</div>
    </div>
  )
}

function FilterSheet({ sort, setSort, onClose, onSelectMode, onEditLocations }) {
  const Option = ({ id, label }) => (
    <ListRow title={<span className="font-normal">{label}</span>} onClick={() => setSort(id)}
      trailing={sort === id ? <Icon name="check" size={20} strokeWidth={2.4} className="text-primary-500 dark:text-primary-300" /> : null} />
  )
  return (
    <Sheet title="Sortieren & mehr" onClose={onClose} cancelLabel="Schließen" confirmLabel="Fertig" onConfirm={onClose}>
      <div className="space-y-5">
        <ListGroup title="Anordnung">
          <Option id="name" label="Nach Lagerort, A–Z" />
          <Option id="mhd" label="Nach Ablaufdatum" />
          <Option id="category" label="Nach Kategorie" />
        </ListGroup>
        <ListGroup>
          <ListRow onClick={onSelectMode} tone="accent" title="Mehrere auswählen …" />
          <ListRow onClick={onEditLocations} tone="accent" title="Lagerorte & Fächer bearbeiten …" />
        </ListGroup>
      </div>
    </Sheet>
  )
}

function EmptyState({ icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-14 gap-3">
      <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center"><Icon name={icon} size={30} /></span>
      <h3 className="text-headline text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-callout text-gray-500 dark:text-gray-400">{text}</p>
      {action}
    </div>
  )
}
