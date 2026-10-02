import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { getMhdStatus, formatMhdDate, formatAmount } from '../utils/mhd'
import { PACKAGING_TYPES } from '../data/spices'
import { FILL_LABELS } from './FillBar'
import SelectionBar from './SelectionBar'
import Sheet from '../ui/Sheet'
import Icon from '../ui/Icon'
import { ListGroup, ListRow } from '../ui/List'
import { SearchField, StatusPill, FillSegments, Segmented } from '../ui/Controls'
import DisposeSheet, { disposalLabel } from '../ui/DisposeSheet'
import { confirmAction, showToast } from '../ui/feedback'

const STATUS_FILTERS = [
  { id: 'all',     label: 'Alle' },
  { id: 'expired', label: 'Abgelaufen' },
  { id: 'soon',    label: 'Bald' },
  { id: 'reorder', label: 'Nachkaufen' },
]

const nameKey = s => s.name.toLowerCase().trim()

function expiryInfo(spice) {
  const mhd = getMhdStatus(spice.expiryDate)
  if (mhd.status === 'none') return { tone: null, text: '' }
  const d = new Date(spice.expiryDate)
  const mmYYYY = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  if (mhd.status === 'expired') return { tone: 'expired', text: `Seit ${mmYYYY}` }
  if (mhd.status === 'critical') return { tone: 'soon', text: mhd.days <= 1 ? 'Läuft ab' : `Noch ${mhd.days} Tage` }
  return { tone: null, text: `MHD ${mmYYYY}` }
}

export default function SpiceList({ onEdit, onAdd }) {
  const rawSpices = useStore(s => s.spices)
  const locations = useStore(s => s.locations)
  const categories = useStore(s => s.categories)
  const dataLoading = useStore(s => s.dataLoading)
  const bulkDeleteSpices = useStore(s => s.bulkDeleteSpices)
  const deleteSpice = useStore(s => s.deleteSpice)

  const allSpices = useMemo(() => rawSpices.filter(s => !s.disposedAt), [rawSpices])
  const disposedSpices = useMemo(() => rawSpices.filter(s => !!s.disposedAt).sort((a, b) => b.disposedAt.localeCompare(a.disposedAt)), [rawSpices])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [packaging, setPackaging] = useState('all')
  const [category, setCategory] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [sort, setSort] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [showDisposed, setShowDisposed] = useState(false)

  // Nachkaufen, wenn ALLE Packungen eines Gewürzes fast leer sind
  const reorderNeeded = useMemo(() => {
    const groups = {}
    allSpices.forEach(s => { (groups[nameKey(s)] ||= []).push(s) })
    return new Set(Object.entries(groups).filter(([, g]) => g.every(s => (s.fillLevel ?? 4) <= 1)).map(([k]) => k))
  }, [allSpices])

  const counts = useMemo(() => ({
    all: allSpices.length,
    expired: allSpices.filter(s => getMhdStatus(s.expiryDate).status === 'expired').length,
    soon: allSpices.filter(s => getMhdStatus(s.expiryDate).status === 'critical').length,
    reorder: allSpices.filter(s => reorderNeeded.has(nameKey(s))).length,
  }), [allSpices, reorderNeeded])

  const filtered = useMemo(() => {
    let list = allSpices
    if (status === 'expired') list = list.filter(s => getMhdStatus(s.expiryDate).status === 'expired')
    if (status === 'soon') list = list.filter(s => getMhdStatus(s.expiryDate).status === 'critical')
    if (status === 'reorder') list = list.filter(s => reorderNeeded.has(nameKey(s)))
    if (packaging !== 'all') list = list.filter(s => s.packagingType === packaging)
    if (category !== 'all') list = list.filter(s => s.category === category)
    if (locationFilter === 'none') list = list.filter(s => !s.locationId)
    else if (locationFilter !== 'all') list = list.filter(s => s.locationId === locationFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q) || (s.brand ?? '').toLowerCase().includes(q))
    }
    return [...list].sort(sort === 'mhd'
      ? (a, b) => (a.expiryDate || '9999') .localeCompare(b.expiryDate || '9999')
      : (a, b) => a.name.localeCompare(b.name, 'de'))
  }, [allSpices, status, packaging, category, locationFilter, search, sort, reorderNeeded])

  // Nach Lagerort gruppieren (bei Sortierung nach MHD eine einzige Liste)
  const groups = useMemo(() => {
    if (sort === 'mhd') return [{ id: 'all', title: 'Nach Ablaufdatum', items: filtered }]
    const byLoc = locations.map(l => ({ id: l.id, title: l.name, items: filtered.filter(s => s.locationId === l.id) }))
    const known = new Set(locations.map(l => l.id))
    const rest = filtered.filter(s => !s.locationId || !known.has(s.locationId))
    return [...byLoc, { id: 'none', title: locations.length ? 'Ohne Lagerort' : null, items: rest }].filter(g => g.items.length)
  }, [filtered, locations, sort])

  const extraFilters = [packaging, category, locationFilter].filter(v => v !== 'all').length + (sort === 'mhd' ? 1 : 0)
  const detailSpice = detailId ? rawSpices.find(s => s.id === detailId) : null

  function toggleSelect(id) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      <div className="px-4 pt-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <SearchField value={search} onChange={setSearch} placeholder="Gewürze durchsuchen" />
          </div>
          <button onClick={() => setShowFilters(true)} aria-label="Filtern und sortieren"
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
      </div>

      <div className="pt-3 pb-28 space-y-5">
        {dataLoading && allSpices.length === 0 ? (
          <p className="text-center text-callout text-gray-500 py-12">Lade Gewürze …</p>
        ) : filtered.length === 0 ? (
          <EmptyState hasSpices={allSpices.length > 0} onAdd={onAdd} />
        ) : (
          groups.map(g => (
            <ListGroup key={g.id} title={g.title}>
              {g.items.map(spice => {
                const exp = expiryInfo(spice)
                const reorder = reorderNeeded.has(nameKey(spice))
                const pkg = PACKAGING_TYPES.find(t => t.id === spice.packagingType)?.label
                return (
                  <ListRow key={spice.id}
                    onClick={() => (selectMode ? toggleSelect(spice.id) : setDetailId(spice.id))}
                    leading={selectMode
                      ? <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-none ${selected.has(spice.id) ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                          {selected.has(spice.id) && <Icon name="check" size={14} strokeWidth={3} />}
                        </span>
                      : spice.imageUrl ? <img src={spice.imageUrl} alt="" className="w-9 h-9 rounded-lg object-contain bg-gray-50 dark:bg-gray-700 flex-none" /> : null}
                    title={spice.name}
                    subtitle={[spice.brand, spice.form || pkg].filter(Boolean).join(' · ')}
                    trailing={
                      <div className="flex flex-col items-end gap-1.5 flex-none">
                        {reorder ? <StatusPill tone="soon">Nachkaufen</StatusPill>
                          : exp.text ? <span className={`text-footnote ${exp.tone === 'expired' ? 'font-semibold text-expired dark:text-expired-dark' : exp.tone === 'soon' ? 'font-semibold text-soon dark:text-soon-dark' : 'text-gray-500 dark:text-gray-400'}`}>{exp.text}</span> : null}
                        <FillSegments level={Math.max(0, Math.min(4, spice.fillLevel ?? 4))} />
                      </div>
                    } />
                )
              })}
            </ListGroup>
          ))
        )}

        {disposedSpices.length > 0 && !selectMode && (
          <ListGroup>
            <ListRow onClick={() => setShowDisposed(v => !v)} title={`Entsorgt (${disposedSpices.length})`}
              trailing={<Icon name="chevron" size={18} className={`text-gray-400 transition-transform ${showDisposed ? 'rotate-90' : ''}`} />} />
            {showDisposed && disposedSpices.map(sp => (
              <ListRow key={sp.id} title={<span className="line-through text-gray-500">{sp.name}</span>}
                subtitle={`${disposalLabel(sp.disposalReason)} · ${new Date(sp.disposedAt).toLocaleDateString('de-DE')}`}
                trailing={
                  <button onClick={async () => {
                    if (await confirmAction({ title: `„${sp.name}“ endgültig löschen?`, confirmLabel: 'Löschen', destructive: true })) deleteSpice(sp.id)
                  }} aria-label={`${sp.name} endgültig löschen`} className="w-11 h-11 -mr-2 flex items-center justify-center text-gray-400">
                    <Icon name="trash" size={20} />
                  </button>
                } />
            ))}
          </ListGroup>
        )}
      </div>

      {showFilters && (
        <FilterSheet onClose={() => setShowFilters(false)}
          sort={sort} setSort={setSort} packaging={packaging} setPackaging={setPackaging}
          category={category} setCategory={setCategory} locationFilter={locationFilter} setLocationFilter={setLocationFilter}
          locations={locations} categories={categories.filter(c => allSpices.some(s => s.category === c.id))}
          onSelectMode={() => { setShowFilters(false); setSelectMode(true); setSelected(new Set()) }} />
      )}

      {detailSpice && !detailSpice.disposedAt && (
        <SpiceDetailSheet spice={detailSpice} reorder={reorderNeeded.has(nameKey(detailSpice))}
          onClose={() => setDetailId(null)} onEdit={() => { setDetailId(null); onEdit(detailSpice) }} />
      )}

      {selectMode && (
        <SelectionBar count={selected.size}
          onDelete={() => { bulkDeleteSpices([...selected]); setSelected(new Set()); setSelectMode(false) }}
          onCancel={() => { setSelected(new Set()); setSelectMode(false) }} />
      )}
    </div>
  )
}

function SpiceDetailSheet({ spice, reorder, onClose, onEdit }) {
  const locations = useStore(s => s.locations)
  const categories = useStore(s => s.categories)
  const updateFillLevel = useStore(s => s.updateFillLevel)
  const addShoppingItem = useStore(s => s.addShoppingItem)
  const disposeSpice = useStore(s => s.disposeSpice)
  const deleteSpice = useStore(s => s.deleteSpice)
  const [disposing, setDisposing] = useState(false)
  const [zoom, setZoom] = useState(false)

  const exp = expiryInfo(spice)
  const pkg = PACKAGING_TYPES.find(t => t.id === spice.packagingType)?.label
  const location = locations.find(l => l.id === spice.locationId)?.name
  const cat = categories.find(c => c.id === spice.category)?.name
  const fill = Math.max(0, Math.min(4, spice.fillLevel ?? 4))

  const facts = [
    ['Menge', formatAmount(spice)],
    ['Haltbar bis', formatMhdDate(spice.expiryDate) ?? '–'],
    ['Verpackung', pkg],
    ['Lagerort', location ?? 'Ohne Lagerort'],
    cat && ['Kategorie', cat],
    spice.form && ['Form', spice.form],
  ].filter(Boolean)

  function shop() {
    addShoppingItem(spice.name, '', true, { spiceId: spice.id, brand: spice.brand })
    if (navigator.vibrate) navigator.vibrate(30)
    showToast(`„${spice.name}“ steht auf der Einkaufsliste.`)
  }

  async function remove() {
    const ok = await confirmAction({ title: `„${spice.name}“ löschen?`, message: 'Zum Aussortieren mit Grund lieber „Entsorgen“ nutzen.', confirmLabel: 'Löschen', destructive: true })
    if (ok) { deleteSpice(spice.id); onClose() }
  }

  return (
    <>
      <Sheet title={spice.name} onClose={onClose} cancelLabel="Schließen" confirmLabel="Bearbeiten" onConfirm={onEdit}>
        <div className="space-y-5">
          <div className="px-5 flex items-start gap-4">
            {spice.imageUrl && (
              <button onClick={() => setZoom(true)} aria-label="Bild vergrößern" className="flex-none w-20 h-20 rounded-card bg-white dark:bg-gray-800 overflow-hidden">
                <img src={spice.imageUrl} alt="" className="w-full h-full object-contain" />
              </button>
            )}
            <div className="min-w-0 pt-1">
              {spice.brand && <p className="text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{spice.brand}</p>}
              <h3 className="text-title text-gray-900 dark:text-gray-50">{spice.name}</h3>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {exp.tone && <StatusPill tone={exp.tone}>{exp.tone === 'expired' ? `Abgelaufen ${exp.text.toLowerCase()}` : exp.text}</StatusPill>}
                {reorder && <StatusPill tone="soon">Nachkaufen</StatusPill>}
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
          </div>

          <section className="px-4 space-y-2">
            <h4 className="px-1 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Füllstand: {FILL_LABELS[fill]}</h4>
            <Segmented label="Füllstand" value={String(fill)} onChange={v => updateFillLevel(spice.id, Number(v))}
              options={[0, 1, 2, 3, 4].map(n => ({ id: String(n), label: FILL_LABELS[n] }))} />
          </section>

          <div className="px-4">
            <button onClick={shop} className="btn-primary w-full"><Icon name="cart" size={20} />Auf die Einkaufsliste</button>
          </div>

          <ListGroup>
            <ListRow onClick={() => setDisposing(true)} leading={<Icon name="trash" size={20} className="text-soon dark:text-soon-dark" />}
              title={<span className="text-soon dark:text-soon-dark">Entsorgen …</span>} trailing={<span className="text-footnote text-gray-500">mit Grund</span>} />
          </ListGroup>

          {spice.notes && <p className="px-6 text-callout text-gray-600 dark:text-gray-300">{spice.notes}</p>}
          {spice.barcode && <p className="px-6 text-footnote text-gray-500">Barcode {spice.barcode}</p>}

          <div className="flex justify-center">
            <button onClick={remove} className="min-h-[44px] px-4 text-callout font-semibold text-expired dark:text-expired-dark">Eintrag löschen</button>
          </div>
        </div>
      </Sheet>

      {disposing && (
        <DisposeSheet name={spice.name} onClose={() => setDisposing(false)}
          onPick={reason => { disposeSpice(spice.id, reason); setDisposing(false); onClose(); showToast(`„${spice.name}“ wurde entsorgt.`) }} />
      )}

      {zoom && (
        <div className="fixed inset-0 z-[75] bg-black/85 flex flex-col items-center justify-center p-6 fade-enter" onClick={() => setZoom(false)}>
          <img src={spice.imageUrl} alt={spice.name} className="max-w-full max-h-[70vh] object-contain rounded-card" />
          <button className="mt-5 min-h-[44px] px-6 rounded-full bg-white/15 text-white font-semibold">Schließen</button>
        </div>
      )}
    </>
  )
}

function FilterSheet({ onClose, sort, setSort, packaging, setPackaging, category, setCategory, locationFilter, setLocationFilter, locations, categories, onSelectMode }) {
  const Option = ({ label, on, onClick }) => (
    <ListRow title={<span className="font-normal">{label}</span>} onClick={onClick}
      trailing={on ? <Icon name="check" size={20} strokeWidth={2.4} className="text-primary-500 dark:text-primary-300" /> : null} />
  )
  const reset = () => { setSort('name'); setPackaging('all'); setCategory('all'); setLocationFilter('all') }
  return (
    <Sheet title="Filtern & sortieren" onClose={onClose} cancelLabel="Schließen" confirmLabel="Fertig" onConfirm={onClose}>
      <div className="space-y-5">
        <div className="px-4">
          <Segmented label="Sortierung" value={sort} onChange={setSort}
            options={[{ id: 'name', label: 'Nach Lagerort A–Z' }, { id: 'mhd', label: 'Nach Ablaufdatum' }]} />
        </div>
        {locations.length > 0 && (
          <ListGroup title="Lagerort">
            <Option label="Alle" on={locationFilter === 'all'} onClick={() => setLocationFilter('all')} />
            {locations.map(l => <Option key={l.id} label={l.name} on={locationFilter === l.id} onClick={() => setLocationFilter(l.id)} />)}
            <Option label="Ohne Lagerort" on={locationFilter === 'none'} onClick={() => setLocationFilter('none')} />
          </ListGroup>
        )}
        <ListGroup title="Verpackung">
          <Option label="Alle" on={packaging === 'all'} onClick={() => setPackaging('all')} />
          {PACKAGING_TYPES.map(p => <Option key={p.id} label={p.label} on={packaging === p.id} onClick={() => setPackaging(p.id)} />)}
        </ListGroup>
        {categories.length > 0 && (
          <ListGroup title="Kategorie">
            <Option label="Alle" on={category === 'all'} onClick={() => setCategory('all')} />
            {categories.map(c => <Option key={c.id} label={c.name} on={category === c.id} onClick={() => setCategory(c.id)} />)}
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

function EmptyState({ hasSpices, onAdd }) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-14 gap-3">
      <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center"><Icon name={hasSpices ? 'search' : 'leaf'} size={30} /></span>
      <h3 className="text-headline text-gray-900 dark:text-gray-100">{hasSpices ? 'Nichts gefunden' : 'Noch keine Gewürze'}</h3>
      <p className="text-callout text-gray-500 dark:text-gray-400">{hasSpices ? 'Passe Suche oder Filter an.' : 'Lege dein erstes Gewürz an – per Barcode geht es am schnellsten.'}</p>
      {!hasSpices && <button onClick={onAdd} className="btn-primary px-6 mt-2"><Icon name="plus" size={20} />Gewürz hinzufügen</button>}
    </div>
  )
}
