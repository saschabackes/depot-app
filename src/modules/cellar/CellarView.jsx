import { useState, useMemo, useEffect } from 'react'
import { useCellar, effectiveDrinkUntil } from './store'
import { shellyGetStatus } from '../../lib/shelly'
import CellarForm from './CellarForm'
import CellarSetup from './CellarSetup'
import RackSettings from './RackSettings'
import WineDetail from './WineDetail'
import ExcelImport from './ExcelImport'
import WinePendingView from './WinePendingView'
import SharePicker from './SharePicker'
import CellarStockTab from './CellarStockTab'
import CellarRackTab from './CellarRackTab'
import CellarDiaryTab, { memoryCounts, filterMemories } from './CellarDiaryTab'
import { CellarFilterSheet, CellarActionsSheet, SWEETNESS_OPTIONS } from './CellarSheets'
import { COLOR_OPTIONS } from './wineConstants'
import { ChipRow } from './cellarUi'
import SelectionBar from '../../components/SelectionBar'
import Icon from '../../ui/Icon'
import { Segmented, SearchField } from '../../ui/Controls'

const TABS = [
  { id: 'bestand',  label: 'Bestand' },
  { id: 'ablauf',   label: 'Trinkreif' },
  { id: 'lager',    label: 'Lager' },
  { id: 'tagebuch', label: 'Tagebuch' },
]

const squareBtn = 'relative w-11 h-11 flex-none rounded-[10px] flex items-center justify-center'
const squareIdle = 'bg-gray-200/70 dark:bg-gray-700 text-primary-500 dark:text-primary-300'

export default function CellarView() {
  const racks = useCellar(s => s.racks)
  const bottles = useCellar(s => s.bottles)
  const setupDone = useCellar(s => s.setupDone)
  const completeSetup = useCellar(s => s.completeSetup)
  const formOpen = useCellar(s => s.formOpen)
  const formPrefill = useCellar(s => s.formPrefill)
  const openForm = useCellar(s => s.openForm)
  const closeForm = useCellar(s => s.closeForm)
  const pending = useCellar(s => s.pending)
  const bulkDeleteBottles = useCellar(s => s.bulkDeleteBottles)
  const sensorReadings = useCellar(s => s.sensorReadings)
  const shellyConfig = useCellar(s => s.shellyConfig)
  const updateSensorReading = useCellar(s => s.updateSensorReading)

  const [tab, setTab] = useState('bestand')
  const [memoryFilter, setMemoryFilter] = useState('all') // all | loved | stocked | empty | archived
  const [activeRackId, setActiveRackId] = useState(racks[0]?.id)
  const [sheet, setSheet] = useState(null) // settings | import | pending | share | filters | actions
  const [sharePreselect, setSharePreselect] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [alcoholFilter, setAlcoholFilter] = useState('all') // all | alc | free
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [colorFilter, setColorFilter] = useState('all')
  const [sweetnessFilter, setSweetnessFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [vintageFilter, setVintageFilter] = useState('all')
  const [sort, setSort] = useState('name') // name | vintage | price | rack
  const [sortDir, setSortDir] = useState('asc')
  const [showGrid, setShowGrid] = useState(false)

  const detailBottle = bottles.find(b => b.id === detailId)
  const activeRack = racks.find(r => r.id === activeRackId) || racks[0]
  const gridRacks = racks.filter(r => r.rows > 0 && r.cols > 0)

  // Live-Werte des Shelly-Sensors im Lager-Tab
  useEffect(() => {
    if (tab !== 'lager' || !shellyConfig || !activeRack?.conditions?.shellyDeviceId) return
    const cached = sensorReadings[activeRack.id]
    if (cached && Date.now() - cached.fetchedAt < 120_000) return
    shellyGetStatus(shellyConfig.authKey, shellyConfig.server, activeRack.conditions.shellyDeviceId)
      .then(data => updateSensorReading(activeRack.id, data))
      .catch(() => {})
  }, [tab, activeRack, shellyConfig, sensorReadings, updateSensorReading])

  const matchesSearch = (b, q) => b.name.toLowerCase().includes(q) || b.winery?.toLowerCase().includes(q) || b.grape?.toLowerCase().includes(q)

  // Kreuzfilter: Optionen jedes Filters richten sich nach allen ANDEREN aktiven Filtern
  const dynamicOptions = useMemo(() => {
    const base = bottles.filter(b => b.count > 0)
    const applyExcept = (exclude) => {
      let arr = base
      if (alcoholFilter === 'alc' && exclude !== 'alcohol') arr = arr.filter(b => !b.alcoholFree)
      if (alcoholFilter === 'free' && exclude !== 'alcohol') arr = arr.filter(b => b.alcoholFree)
      if (colorFilter !== 'all' && exclude !== 'color') arr = arr.filter(b => b.color === colorFilter)
      if (sweetnessFilter !== 'all' && exclude !== 'sweetness') arr = arr.filter(b => b.sweetness === sweetnessFilter)
      if (countryFilter !== 'all' && exclude !== 'country') arr = arr.filter(b => b.country === countryFilter)
      if (vintageFilter !== 'all' && exclude !== 'vintage') arr = arr.filter(b => b.vintage === parseInt(vintageFilter))
      if (search.trim()) arr = arr.filter(b => matchesSearch(b, search.toLowerCase()))
      return arr
    }
    const forColor = applyExcept('color')
    return {
      sweetness: SWEETNESS_OPTIONS.filter(s => applyExcept('sweetness').some(b => b.sweetness === s.id)),
      vintages: [...new Set(applyExcept('vintage').map(b => b.vintage).filter(v => v > 0))].sort((a, b) => b - a),
      countries: [...new Set(applyExcept('country').map(b => b.country).filter(Boolean))].sort(),
      colorCounts: Object.fromEntries([['all', forColor.length], ...COLOR_OPTIONS.map(c => [c.id, forColor.filter(b => b.color === c.id).length])]),
    }
  }, [bottles, alcoholFilter, colorFilter, sweetnessFilter, countryFilter, vintageFilter, search])

  // Filter zurücksetzen, deren Wert nicht mehr vorkommt
  useEffect(() => {
    if (sweetnessFilter !== 'all' && !dynamicOptions.sweetness.some(s => s.id === sweetnessFilter)) setSweetnessFilter('all')
    if (vintageFilter !== 'all' && !dynamicOptions.vintages.includes(parseInt(vintageFilter))) setVintageFilter('all')
    if (countryFilter !== 'all' && !dynamicOptions.countries.includes(countryFilter)) setCountryFilter('all')
  }, [dynamicOptions, sweetnessFilter, vintageFilter, countryFilter])

  const filtered = useMemo(() => {
    let arr = bottles.filter(b => b.count > 0)
    if (alcoholFilter === 'alc')  arr = arr.filter(b => !b.alcoholFree)
    if (alcoholFilter === 'free') arr = arr.filter(b => b.alcoholFree)
    if (colorFilter !== 'all')     arr = arr.filter(b => b.color === colorFilter)
    if (sweetnessFilter !== 'all') arr = arr.filter(b => b.sweetness === sweetnessFilter)
    if (countryFilter !== 'all')   arr = arr.filter(b => b.country === countryFilter)
    if (vintageFilter !== 'all')   arr = arr.filter(b => b.vintage === parseInt(vintageFilter))
    if (search.trim()) arr = arr.filter(b => matchesSearch(b, search.toLowerCase()))

    if (tab === 'ablauf') {
      const y = new Date().getFullYear()
      const eff = b => effectiveDrinkUntil(b, racks.find(r => r.id === b.rackId))
      return arr.filter(b => y >= b.drinkFrom && y <= eff(b)).sort((a, b) => eff(a) - eff(b))
    }
    const dir = sortDir === 'asc' ? 1 : -1
    if (sort === 'vintage') return arr.sort((a, b) => dir * ((a.vintage || 0) - (b.vintage || 0)))
    if (sort === 'price')   return arr.sort((a, b) => dir * ((a.priceEur || 0) - (b.priceEur || 0)))
    if (sort === 'rack') return arr.sort((a, b) => {
      const pos = x => (x.row || 0) * 1000 + (x.col || 0)
      return dir * ((pos(a) - pos(b)) || (a.slot || '').localeCompare(b.slot || '', 'de'))
    })
    return arr.sort((a, b) => dir * a.name.localeCompare(b.name, 'de'))
  }, [bottles, tab, racks, alcoholFilter, colorFilter, sweetnessFilter, countryFilter, vintageFilter, search, sort, sortDir])

  // Bestand nach Regal gruppiert
  const groups = useMemo(() => {
    const known = new Set(racks.map(r => r.id))
    const byRack = racks.map(r => ({ id: r.id, title: `${r.emoji ? r.emoji + ' ' : ''}${r.label}`, rack: r, items: filtered.filter(b => b.rackId === r.id) }))
    const rest = filtered.filter(b => !known.has(b.rackId))
    return [...byRack, { id: 'none', title: 'Ohne Lagerort', rack: null, items: rest }].filter(g => g.items.length)
  }, [filtered, racks])

  const memories = useMemo(() => filterMemories(bottles, memoryFilter), [bottles, memoryFilter])

  if (!setupDone) {
    return <CellarSetup onComplete={completeSetup} />
  }

  const extraFilters = [sweetnessFilter, countryFilter, vintageFilter, alcoholFilter].filter(v => v !== 'all').length
    + (sort !== 'name' || sortDir !== 'asc' ? 1 : 0)

  function toggleSelect(id) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  function openRow(id) { selectMode ? toggleSelect(id) : setDetailId(id) }
  function openShare(id = null) { setSharePreselect(id); setSheet('share') }
  function changeTab(t) {
    setTab(t)
    if (t === 'lager' || t === 'tagebuch') { setSelectMode(false); setSelected(new Set()) }
  }
  function resetFilters() {
    setSort('name'); setSortDir('asc'); setSweetnessFilter('all'); setCountryFilter('all'); setVintageFilter('all'); setAlcoholFilter('all'); setColorFilter('all')
  }

  const listTab = tab === 'bestand' || tab === 'ablauf'

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      <div className="px-4 pt-3 space-y-2.5">
        <Segmented label="Ansicht" value={tab} onChange={changeTab} options={TABS} />

        {listTab && (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <SearchField value={search} onChange={setSearch} placeholder="Wein, Weingut, Rebsorte" label="Weine durchsuchen" />
              </div>
              {tab === 'bestand' && gridRacks.length > 0 && (
                <button onClick={() => setShowGrid(g => !g)} aria-pressed={showGrid}
                  aria-label={showGrid ? 'Regalplan ausblenden' : 'Regalplan einblenden'}
                  className={`${squareBtn} ${showGrid ? 'bg-primary-500 text-white dark:bg-primary-300 dark:text-gray-900' : squareIdle}`}>
                  <Icon name="grid" size={20} strokeWidth={2} />
                </button>
              )}
              <button onClick={() => setSheet('filters')} aria-label="Filtern und sortieren" className={`${squareBtn} ${squareIdle}`}>
                <Icon name="filter" size={22} strokeWidth={2.1} />
                {extraFilters > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary-500 text-white text-[11px] font-bold leading-[18px] text-center">{extraFilters}</span>}
              </button>
              <button onClick={() => setSheet('actions')} aria-label="Weitere Aktionen" className={`${squareBtn} ${squareIdle}`}>
                <Icon name="more" size={22} strokeWidth={2.4} />
                {pending.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-soon dark:bg-soon-dark" />}
              </button>
            </div>
            <ChipRow value={colorFilter} onChange={setColorFilter}
              items={[{ id: 'all', label: 'Alle' }, ...COLOR_OPTIONS]
                .filter(c => c.id === 'all' || c.id === colorFilter || dynamicOptions.colorCounts[c.id] > 0)
                .map(c => ({ ...c, count: dynamicOptions.colorCounts[c.id] }))} />
          </>
        )}

        {tab === 'tagebuch' && (
          <ChipRow value={memoryFilter} onChange={setMemoryFilter}
            items={memoryCounts(bottles).filter(f => f.id === 'all' || f.id === memoryFilter || f.count > 0)} />
        )}
      </div>

      <div className="pt-3 pb-28 space-y-5">
        {listTab && (
          <CellarStockTab
            mode={tab} bottles={bottles} racks={racks} filtered={filtered} groups={groups}
            pendingCount={pending.length} onOpenPending={() => setSheet('pending')}
            showGrid={tab === 'bestand' && showGrid} gridRacks={gridRacks}
            activeRack={activeRack} onRackChange={setActiveRackId}
            selectMode={selectMode} selected={selected} onRow={openRow}
            onCell={(r, row, col, first) => first ? setDetailId(first.id) : openForm({ rackId: r.id, row, col })}
            onAdd={() => openForm()} onImport={() => setSheet('import')}
            hasFilters={!!search.trim() || colorFilter !== 'all' || extraFilters > 0}
            onResetFilters={() => { setSearch(''); resetFilters() }} />
        )}

        {tab === 'lager' && (
          <CellarRackTab
            racks={racks} bottles={bottles} activeRack={activeRack} onRackChange={setActiveRackId}
            reading={activeRack ? sensorReadings[activeRack.id] : null}
            onOpen={id => setDetailId(id)}
            onCell={(row, col, first) => first ? setDetailId(first.id) : openForm({ rackId: activeRack.id, row, col })}
            onAdd={() => openForm(activeRack ? { rackId: activeRack.id } : null)}
            onSettings={() => setSheet('settings')} />
        )}

        {tab === 'tagebuch' && (
          <CellarDiaryTab memories={memories} racks={racks} memoryFilter={memoryFilter} onOpen={id => setDetailId(id)} />
        )}
      </div>

      {formOpen && <CellarForm prefilled={formPrefill} onClose={closeForm} />}
      {sheet === 'settings' && <RackSettings onClose={() => setSheet(null)} />}
      {sheet === 'import'   && <ExcelImport onClose={() => setSheet(null)} onImported={() => setSheet('pending')} />}
      {sheet === 'pending'  && <WinePendingView onClose={() => setSheet(null)} />}
      {sheet === 'share'    && <SharePicker preselected={sharePreselect} onClose={() => setSheet(null)} />}
      {sheet === 'filters' && (
        <CellarFilterSheet onClose={() => setSheet(null)}
          sort={sort} setSort={setSort} sortDir={sortDir} setSortDir={setSortDir}
          alcohol={alcoholFilter} setAlcohol={setAlcoholFilter}
          sweetness={sweetnessFilter} setSweetness={setSweetnessFilter}
          vintage={vintageFilter} setVintage={setVintageFilter}
          country={countryFilter} setCountry={setCountryFilter}
          options={dynamicOptions} onReset={resetFilters} showSort={tab === 'bestand'}
          onSelectMode={() => { setSheet(null); setSelectMode(true); setSelected(new Set()) }} />
      )}
      {sheet === 'actions' && (
        <CellarActionsSheet onClose={() => setSheet(null)} bottles={bottles} racks={racks} pendingCount={pending.length}
          onPending={() => setSheet('pending')} onShare={() => openShare(null)} onImport={() => setSheet('import')}
          onSettings={() => setSheet('settings')}
          onSelectMode={() => { setSheet(null); setSelectMode(true); setSelected(new Set()) }} />
      )}

      {selectMode && (
        <SelectionBar count={selected.size}
          onDelete={() => { bulkDeleteBottles([...selected]); setSelected(new Set()); setSelectMode(false) }}
          onCancel={() => { setSelected(new Set()); setSelectMode(false) }} />
      )}

      {detailBottle && (
        <WineDetail
          bottle={detailBottle}
          onClose={() => setDetailId(null)}
          onOpenPairing={() => setDetailId(null)}
          onShare={id => { setDetailId(null); openShare(id) }}
          onDuplicate={prefill => { setDetailId(null); openForm(prefill) }}
        />
      )}
    </div>
  )
}
