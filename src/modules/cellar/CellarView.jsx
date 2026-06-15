import { useState, useMemo, useEffect } from 'react'
import { useCellar, drinkStatus, effectiveDrinkUntil } from './store'
import CellarForm from './CellarForm'
import CellarSetup from './CellarSetup'
import RackSettings from './RackSettings'
import WineDetail from './WineDetail'
import ExcelImport from './ExcelImport'
import WinePendingView from './WinePendingView'
import SharePicker from './SharePicker'
import SubTabs from '../../components/SubTabs'
import SelectionBar from '../../components/SelectionBar'

const COLOR_EMOJI = { rot: '🍷', weiß: '🥂', rosé: '🌸', schaum: '🍾' }
const COLOR_OPTIONS = [
  { id: 'rot', label: '🍷 Rot' },
  { id: 'weiß', label: '🥂 Weiß' },
  { id: 'rosé', label: '🌸 Rosé' },
  { id: 'schaum', label: '🍾 Schaum' },
]
const SWEETNESS_OPTIONS = [
  { id: 'trocken', label: 'Trocken' },
  { id: 'halbtrocken', label: 'Halbtrocken' },
  { id: 'lieblich', label: 'Lieblich' },
  { id: 'süß', label: 'Süß' },
  { id: 'brut', label: 'Brut' },
  { id: 'extra brut', label: 'Extra Brut' },
]

export default function CellarView() {
  const { racks, bottles, drinkOne, removeBottle,
          setupDone, completeSetup,
          formOpen, formPrefill, openForm, closeForm, pending,
          bulkDeleteBottles } = useCellar()
  const [tab, setTab] = useState('bestand')
  const [memoryFilter, setMemoryFilter] = useState('all') // all | loved | stocked | empty
  const [activeRackId, setActiveRackId] = useState(racks[0]?.id)
  const [showSettings, setShowSettings] = useState(false)
  const [showImport, setShowImport]   = useState(false)
  const [showPending, setShowPending] = useState(false)
  const [showShare, setShowShare]     = useState(false)
  const [sharePreselect, setSharePreselect] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const detailBottle = bottles.find(b => b.id === detailId)
  const [alcoholFilter, setAlcoholFilter] = useState('all') // all | alc | free
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [colorFilter, setColorFilter] = useState('all')
  const [sweetnessFilter, setSweetnessFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [vintageFilter, setVintageFilter] = useState('all')
  const [sort, setSort] = useState('name') // name | vintage | price
  const [sortDir, setSortDir] = useState('asc') // asc | desc

  const activeRack = racks.find(r => r.id === activeRackId) || racks[0]

  // Cross-filter: each filter's options are based on all OTHER active filters
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
      if (search.trim()) {
        const q = search.toLowerCase()
        arr = arr.filter(b => b.name.toLowerCase().includes(q) || b.winery?.toLowerCase().includes(q) || b.grape?.toLowerCase().includes(q))
      }
      return arr
    }
    return {
      sweetness: SWEETNESS_OPTIONS.filter(s => applyExcept('sweetness').some(b => b.sweetness === s.id)),
      vintages: [...new Set(applyExcept('vintage').map(b => b.vintage).filter(v => v > 0))].sort((a, b) => b - a),
      countries: [...new Set(applyExcept('country').map(b => b.country).filter(Boolean))].sort(),
    }
  }, [bottles, alcoholFilter, colorFilter, sweetnessFilter, countryFilter, vintageFilter, search])

  // Auto-reset filters whose value is no longer available
  useEffect(() => {
    if (sweetnessFilter !== 'all' && !dynamicOptions.sweetness.some(s => s.id === sweetnessFilter)) setSweetnessFilter('all')
    if (vintageFilter !== 'all' && !dynamicOptions.vintages.includes(parseInt(vintageFilter))) setVintageFilter('all')
    if (countryFilter !== 'all' && !dynamicOptions.countries.includes(countryFilter)) setCountryFilter('all')
  }, [dynamicOptions, sweetnessFilter, vintageFilter, countryFilter])

  const filtered = useMemo(() => {
    let arr = bottles
    if (alcoholFilter === 'alc')  arr = arr.filter(b => !b.alcoholFree)
    if (alcoholFilter === 'free') arr = arr.filter(b => b.alcoholFree)
    if (colorFilter !== 'all')       arr = arr.filter(b => b.color === colorFilter)
    if (sweetnessFilter !== 'all')   arr = arr.filter(b => b.sweetness === sweetnessFilter)
    if (countryFilter !== 'all')     arr = arr.filter(b => b.country === countryFilter)
    if (vintageFilter !== 'all')     arr = arr.filter(b => b.vintage === parseInt(vintageFilter))
    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(b => b.name.toLowerCase().includes(q) || b.winery?.toLowerCase().includes(q) || b.grape?.toLowerCase().includes(q))
    }
    if (tab === 'ablauf') {
      const y = new Date().getFullYear()
      return arr.filter(b => {
        const rk = racks.find(r => r.id === b.rackId)
        const eff = effectiveDrinkUntil(b, rk)
        return y >= b.drinkFrom && y <= eff && b.count > 0
      }).sort((a,b) => {
        const ra = racks.find(r => r.id === a.rackId)
        const rb = racks.find(r => r.id === b.rackId)
        return effectiveDrinkUntil(a, ra) - effectiveDrinkUntil(b, rb)
      })
    }
    if (tab === 'lager' && activeRack) {
      return arr.filter(b => b.rackId === activeRack.id && b.count > 0)
                .sort((a,b) => a.slot.localeCompare(b.slot))
    }
    let result = arr.filter(b => b.count > 0)
    const dir = sortDir === 'asc' ? 1 : -1
    if (sort === 'vintage') result = result.sort((a,b) => dir * ((a.vintage || 0) - (b.vintage || 0)))
    else if (sort === 'price') result = result.sort((a,b) => dir * ((a.priceEur || 0) - (b.priceEur || 0)))
    else result = result.sort((a,b) => dir * a.name.localeCompare(b.name, 'de'))
    return result
  }, [bottles, tab, activeRack, alcoholFilter, colorFilter, sweetnessFilter, countryFilter, vintageFilter, search, sort, sortDir])

  // Weintagebuch: bewertet ODER mind. 1× getrunken (egal ob noch Bestand)
  const memories = useMemo(() => {
    let arr
    if (memoryFilter === 'archived') {
      arr = bottles.filter(b => b.archived)
    } else {
      arr = bottles.filter(b => !b.archived && ((b.rating > 0) || (b.history?.length > 0)))
      if (memoryFilter === 'loved')   arr = arr.filter(b => (b.rating || 0) >= 4)
      if (memoryFilter === 'stocked') arr = arr.filter(b => b.count > 0)
      if (memoryFilter === 'empty')   arr = arr.filter(b => b.count <= 0)
    }
    if (alcoholFilter === 'alc')  arr = arr.filter(b => !b.alcoholFree)
    if (alcoholFilter === 'free') arr = arr.filter(b => b.alcoholFree)
    const lastTasted = (b) => {
      const h = b.history || []
      return h.length ? new Date(h[h.length-1].date).getTime() : 0
    }
    return arr.sort((a,b) => {
      const r = (b.rating||0) - (a.rating||0)
      if (r !== 0) return r
      return lastTasted(b) - lastTasted(a)
    })
  }, [bottles, memoryFilter, alcoholFilter])

  const totalBottles = bottles.reduce((s, b) => s + b.count, 0)

  if (!setupDone) {
    return <CellarSetup onComplete={completeSetup} />
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">🍷 Wein</p>
            <p className="text-xs text-gray-400">
              {bottles.length} Position{bottles.length===1?'':'en'} · {totalBottles} Flaschen · {racks.length} Lager
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectMode(m => !m); setSelected(new Set()) }}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                selectMode ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {selectMode ? 'Fertig' : 'Auswählen'}
            </button>
            <button onClick={() => { setSharePreselect(null); setShowShare(true) }}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-2 text-lg" title="Weine empfehlen">🔗</button>
            {pending.length > 0 && (
              <button onClick={() => setShowPending(true)}
                className="relative bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 rounded-full p-2 text-lg" title="Einräumen">
                📦
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pending.length}
                </span>
              </button>
            )}
            <button onClick={() => setShowImport(true)}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-2 text-lg" title="Excel-Import">📥</button>
            <button onClick={() => setShowSettings(true)}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-2 text-lg" title="Regale verwalten">⚙️</button>
          </div>
        </div>
      </div>

      <SubTabs
        tabs={[
          { id: 'bestand',  label: '📦 Bestand' },
          { id: 'ablauf',   label: '⏰ Ablauf' },
          { id: 'lager',    label: '🗄️ Lager' },
          { id: 'tagebuch', label: '📒 Weintagebuch' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Suchfeld + Filter (nicht im Tagebuch-Tab) */}
      {tab !== 'tagebuch' && (
        <>
          {/* Suchfeld */}
          <div className="px-4 pt-2 pb-1.5 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input
                type="search"
                className="input pl-9 py-2 bg-gray-50 dark:bg-gray-900/40 text-sm"
                placeholder="Wein, Weingut oder Rebsorte suchen…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Farbe + Sortierung */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {[{ id: 'all', label: 'Alle' }, ...COLOR_OPTIONS].map(c => (
              <button key={c.id} onClick={() => setColorFilter(f => f === c.id ? 'all' : c.id)}
                className={`flex-none rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  colorFilter === c.id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>{c.label}</button>
            ))}
            <div className="flex-none border-l border-gray-200 dark:border-gray-700 mx-1" />
            <button onClick={() => setSort(s => s === 'name' ? 'vintage' : s === 'vintage' ? 'price' : 'name')}
              className="flex-none flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round"/>
              </svg>
              {sort === 'name' ? 'A–Z' : sort === 'vintage' ? 'Jahrgang' : 'Preis'}
            </button>
            <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="flex-none flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Geschmack (nur wenn Daten vorhanden) */}
          {dynamicOptions.sweetness.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
              <button onClick={() => setSweetnessFilter('all')}
                className={`flex-none rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  sweetnessFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>Alle</button>
              {dynamicOptions.sweetness.map(s => (
                <button key={s.id} onClick={() => setSweetnessFilter(f => f === s.id ? 'all' : s.id)}
                  className={`flex-none rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    sweetnessFilter === s.id ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>{s.label}</button>
              ))}
            </div>
          )}

          {/* Jahrgang (nur wenn Daten vorhanden) */}
          {dynamicOptions.vintages.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
              <button onClick={() => setVintageFilter('all')}
                className={`flex-none rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  vintageFilter === 'all' ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>Alle Jahrgänge</button>
              {dynamicOptions.vintages.map(v => (
                <button key={v} onClick={() => setVintageFilter(f => f === String(v) ? 'all' : String(v))}
                  className={`flex-none rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    vintageFilter === String(v) ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>{v}</button>
              ))}
            </div>
          )}

          {/* Land (nur wenn Daten vorhanden) */}
          {dynamicOptions.countries.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
              <button onClick={() => setCountryFilter('all')}
                className={`flex-none rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  countryFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>Alle Länder</button>
              {dynamicOptions.countries.map(c => (
                <button key={c} onClick={() => setCountryFilter(f => f === c ? 'all' : c)}
                  className={`flex-none rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    countryFilter === c ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>{c}</button>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'tagebuch' && (
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all',      label: 'Alle',            count: bottles.filter(b => !b.archived && (b.rating > 0 || b.history?.length)).length },
            { id: 'loved',    label: 'Lieblinge',       count: bottles.filter(b => !b.archived && (b.rating||0) >= 4).length },
            { id: 'stocked',  label: 'Im Bestand',      count: bottles.filter(b => !b.archived && (b.rating > 0 || b.history?.length) && b.count > 0).length },
            { id: 'empty',    label: 'Ausgetrunken',    count: bottles.filter(b => !b.archived && (b.rating > 0 || b.history?.length) && b.count <= 0).length },
            { id: 'archived', label: '📦 Archiv',       count: bottles.filter(b => b.archived).length },
          ].map(f => (
            <button key={f.id} onClick={() => setMemoryFilter(f.id)}
              className={`flex-none text-xs font-semibold px-2.5 py-1 rounded-full ${
                memoryFilter === f.id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
              {f.label} {f.count > 0 && <span className="opacity-70">·{f.count}</span>}
            </button>
          ))}
        </div>
      )}

      {tab === 'lager' && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-3">
          {racks.map(r => {
            const count = bottles.filter(b => b.rackId === r.id).reduce((s,b)=>s+b.count,0)
            const active = activeRack?.id === r.id
            return (
              <button key={r.id} onClick={() => setActiveRackId(r.id)}
                className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                  active ? 'bg-primary-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}>
                <span>{r.emoji}</span><span>{r.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/30' : 'bg-gray-100 dark:bg-gray-700'}`}>{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {bottles.length === 0 && (
        <div className="m-4 p-5 rounded-2xl bg-white dark:bg-gray-800 text-center">
          <p className="text-3xl mb-2">🍷</p>
          <p className="text-gray-700 dark:text-gray-200 font-medium">Noch keine Flaschen.</p>
          <p className="text-xs text-gray-400 mt-1">Tippe auf + um die erste Flasche anzulegen.</p>
        </div>
      )}

      {tab === 'tagebuch' && (
        <div className="px-4 space-y-2.5">
          {memories.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 text-center">
              <p className="text-3xl mb-2">📒</p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {memoryFilter === 'archived'
                  ? 'Kein Wein archiviert. Archiviere Weine, die du ausblenden möchtest.'
                  : 'Noch keine Einträge. Sobald du eine Flasche getrunken & bewertet hast, taucht sie hier auf.'}
              </p>
            </div>
          )}
          {memories.map(b => <MemoryCard key={b.id} b={b} racks={racks} onOpen={() => setDetailId(b.id)}
            onRestock={() => useCellar.getState().toggleRestock(b.id)}
            onArchive={() => useCellar.getState().updateBottle(b.id, { archived: !b.archived })} />)}
        </div>
      )}

      {tab === 'lager' && activeRack?.rows > 0 && activeRack?.cols > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm overflow-x-auto">
            <table className="border-collapse mx-auto">
              <tbody>
                {Array.from({ length: activeRack.rows }, (_, ri) => (
                  <tr key={ri}>
                    <td className="text-[10px] text-gray-400 pr-1.5 text-right font-medium w-6">{ri + 1}</td>
                    {Array.from({ length: activeRack.cols }, (_, ci) => {
                      const r1 = ri + 1, c1 = ci + 1
                      const here = bottles.filter(b => b.rackId === activeRack.id && b.row === r1 && b.col === c1 && b.count > 0)
                      const total = here.reduce((s, b) => s + b.count, 0)
                      const first = here[0]
                      return (
                        <td key={ci}
                          onClick={() => first && setDetailId(first.id)}
                          className={`w-12 h-12 text-center border border-gray-200 dark:border-gray-600 transition-colors ${
                            total > 0
                              ? 'bg-primary-50 dark:bg-primary-900/30 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/50'
                              : 'bg-gray-50 dark:bg-gray-800'
                          }`}>
                          {total > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm">🍷</span>
                              {total > 1 && <span className="text-[9px] font-bold text-primary-600 dark:text-primary-400 -mt-0.5">{total}</span>}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-300 dark:text-gray-600">·</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr>
                  <td />
                  {Array.from({ length: activeRack.cols }, (_, ci) => (
                    <td key={ci} className="text-[10px] text-gray-400 text-center font-medium pt-0.5">{ci + 1}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab !== 'tagebuch' && (
        <div className="px-4 space-y-2.5">
          {filtered.map(b => {
            const r = racks.find(r => r.id === b.rackId)
            const status = drinkStatus(b, r)
            return (
              <div key={b.id} className="flex items-start gap-2">
                {selectMode && (
                  <button
                    onClick={() => setSelected(prev => { const next = new Set(prev); next.has(b.id) ? next.delete(b.id) : next.add(b.id); return next })}
                    className={`mt-4 flex-none w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected.has(b.id) ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selected.has(b.id) && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                )}
                <button onClick={() => selectMode
                    ? setSelected(prev => { const next = new Set(prev); next.has(b.id) ? next.delete(b.id) : next.add(b.id); return next })
                    : setDetailId(b.id)
                  }
                  className="flex-1 text-left bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm active:scale-[0.99] transition-transform">
                  <div className="flex items-start gap-3">
                    {b.photoData
                      ? <img src={b.photoData} alt="" className="w-12 h-16 rounded object-cover flex-none" />
                      : <div className="text-3xl flex-none w-12 text-center">{COLOR_EMOJI[b.color] || '🍷'}</div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 dark:text-gray-100 truncate">{b.name}</span>
                        <span className="text-xs text-gray-400">{b.vintage || ''}</span>
                        {b.rating > 0 && <span className="text-xs">{'⭐'.repeat(b.rating)}</span>}
                        {b.alcoholFree && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-1.5 py-0.5 rounded">🚫 0%</span>}
                        {b.archived && <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded">📦 Archiv</span>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {[b.winery, b.region, b.country, b.grape].filter(Boolean).join(' · ')}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {b.color && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          b.color === 'rot' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                          b.color === 'weiß' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                          b.color === 'rosé' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                        }`}>{b.color}</span>}
                        {b.sweetness && <span className="text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">{b.sweetness}</span>}
                        {b.priceEur != null && <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{b.priceEur.toFixed(0)} €</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                          {r?.emoji} {r?.label || '—'} · {b.row && b.col ? `R${b.row}/S${b.col}` : b.slot || '—'}
                        </span>
                        <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{b.count}×</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${status.cls}`}>{status.label}</span>
                        {b.restock && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-300">+ nachkaufen</span>}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      )}



      {formOpen && <CellarForm prefilled={formPrefill} onClose={closeForm} />}
      {showSettings && <RackSettings onClose={() => setShowSettings(false)} />}
      {showImport   && <ExcelImport  onClose={() => setShowImport(false)} onImported={() => setShowPending(true)} />}
      {showPending  && <WinePendingView onClose={() => setShowPending(false)} />}
      {showShare    && <SharePicker  preselected={sharePreselect} onClose={() => setShowShare(false)} />}

      {selectMode && (
        <SelectionBar
          count={selected.size}
          onDelete={() => { bulkDeleteBottles([...selected]); setSelected(new Set()); setSelectMode(false) }}
          onCancel={() => { setSelected(new Set()); setSelectMode(false) }}
        />
      )}

      {detailBottle && (
        <WineDetail
          bottle={detailBottle}
          onClose={() => setDetailId(null)}
          onOpenPairing={() => { setDetailId(null) }}
          onShare={(id) => { setDetailId(null); setSharePreselect(id); setShowShare(true) }}
        />
      )}
    </div>
  )
}

// ── Memory-Card (Weintagebuch) ───────────────────────────────────────────────
function MemoryCard({ b, racks, onOpen, onRestock, onArchive }) {
  const COLOR_EMOJI = { rot: '🍷', weiß: '🥂', rosé: '🌸', schaum: '🍾' }
  const lastTaste = b.history?.length ? b.history[b.history.length - 1] : null
  const r = racks.find(r => r.id === b.rackId)
  const empty = b.count <= 0
  const fmtAgo = (d) => {
    if (!d) return ''
    const days = Math.round((Date.now() - new Date(d).getTime()) / 86400000)
    if (days <= 1) return 'gestern'
    if (days < 30) return `vor ${days} Tagen`
    if (days < 365) return `vor ${Math.round(days/30)} Monaten`
    return `vor ${Math.round(days/365)} J`
  }
  return (
    <div className={`rounded-2xl p-3 shadow-sm ${empty ? 'bg-gray-50 dark:bg-gray-800/60' : 'bg-white dark:bg-gray-800'}`}>
      <button onClick={onOpen} className="w-full text-left flex items-start gap-3">
        {b.photoData
          ? <img src={b.photoData} alt="" className={`w-12 h-16 rounded object-cover flex-none ${empty ? 'opacity-60' : ''}`} />
          : <div className={`text-3xl flex-none w-12 text-center ${empty ? 'opacity-50' : ''}`}>{COLOR_EMOJI[b.color] || '🍷'}</div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-800 dark:text-gray-100 truncate">{b.name}</span>
            <span className="text-xs text-gray-400">{b.vintage}</span>
            {b.rating > 0 && <span className="text-xs">{'⭐'.repeat(b.rating)}</span>}
            {b.alcoholFree && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-1.5 py-0.5 rounded">🚫 0%</span>}
            {b.archived && <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded">📦 Archiv</span>}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {b.winery}{b.region && ` · ${b.region}`}{b.grape && ` · ${b.grape}`}
          </p>
          {lastTaste && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 italic truncate">
              📒 {fmtAgo(lastTaste.date)}
              {lastTaste.occasion && ` · „${lastTaste.occasion}"`}
              {lastTaste.note     && ` · ${lastTaste.note}`}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {empty
              ? <span className="text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">AUSGETRUNKEN</span>
              : <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">{b.count}× im Bestand</span>}
            {r && <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{r.emoji} {r.label}</span>}
            {b.history?.length > 0 && <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{b.history.length}× getrunken</span>}
            {b.priceEur != null && <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{b.priceEur.toFixed(0)} €</span>}
          </div>
        </div>
      </button>
      <div className="mt-2.5 flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); onRestock() }}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-lg ${
            b.restock
              ? 'bg-emerald-600 text-white'
              : empty
                ? 'bg-primary-600 text-white'
                : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
          }`}>
          {b.restock ? '✓ auf Einkaufsliste' : empty ? '🔄 Wieder kaufen' : '+ Einkaufsliste'}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onArchive() }}
          className="text-xs font-semibold py-1.5 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          {b.archived ? '📤 Wiederherstellen' : '📦 Archivieren'}
        </button>
      </div>
    </div>
  )
}
