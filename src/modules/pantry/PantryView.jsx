import { useState, useMemo } from 'react'
import { usePantry, CATEGORIES } from './store'
import PantryForm from './PantryForm'
import PantrySetup from './PantrySetup'
import QRLabel from './QRLabel'
import SubTabs from '../../components/SubTabs'
import SelectionBar from '../../components/SelectionBar'

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
function expiryBadge(item) {
  const d = daysUntil(item.bestBefore)
  if (d === null) return null
  if (d < 0) return { text: `${-d} T überfällig`, cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' }
  if (d <= 14) return { text: `noch ${d} T`, cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' }
  if (d <= 60) return { text: `noch ${d} T`, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
  return { text: `noch ${d} T`, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
}
function catLabel(id) {
  const c = CATEGORIES.find(c => c.id === id)
  return c ? `${c.emoji} ${c.label}` : id
}

const APP_URL = typeof window !== 'undefined' ? window.location.origin : ''

const DISPOSAL_REASONS = [
  { id: 'schaedling', label: 'Schädlingsbefall', emoji: '🐛' },
  { id: 'abgelaufen', label: 'Abgelaufen / verdorben', emoji: '🤢' },
  { id: 'schimmel', label: 'Schimmel', emoji: '🦠' },
  { id: 'beschaedigt', label: 'Verpackung beschädigt', emoji: '📦' },
  { id: 'qualitaet', label: 'Qualität schlecht', emoji: '👎' },
  { id: 'sonstiges', label: 'Sonstiges', emoji: '❓' },
]

export default function PantryView() {
  const { locations, items, removeItem, disposeItem, toggleRestock,
    setupDone, completeSetup, formOpen, formPrefill, openForm, closeForm,
    bulkDeleteItems, updateItem } = usePantry()
  const [tab, setTab] = useState('bestand')
  const [activeLocationId, setActiveLocationId] = useState(locations[0]?.id)
  const [showSettings, setShowSettings] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [editingItem, setEditingItem] = useState(null)
  const [sort, setSort] = useState('name')
  const [detailId, setDetailId] = useState(null)
  const [disposeTarget, setDisposeTarget] = useState(null)

  const activeItems = useMemo(() => items.filter(it => !it.disposedAt), [items])
  const disposedItems = useMemo(() => items.filter(it => !!it.disposedAt).sort((a, b) => b.disposedAt.localeCompare(a.disposedAt)), [items])

  const activeLocation = locations.find(l => l.id === activeLocationId) || locations[0]
  const shelvesOfActive = activeLocation?.shelves || []

  const byShelf = useMemo(() => {
    const map = Object.fromEntries(shelvesOfActive.map(sh => [sh.id, []]))
    activeItems.filter(it => it.locationId === activeLocation?.id).forEach(it => {
      (map[it.shelfId] ||= []).push(it)
    })
    Object.values(map).forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, 'de')))
    return map
  }, [shelvesOfActive, activeItems, activeLocation])

  const sorted = useMemo(() => {
    const arr = [...activeItems]
    if (sort === 'name') arr.sort((a, b) => a.name.localeCompare(b.name, 'de'))
    else if (sort === 'mhd') arr.sort((a, b) => {
      if (!a.bestBefore) return 1; if (!b.bestBefore) return -1
      return new Date(a.bestBefore) - new Date(b.bestBefore)
    })
    else if (sort === 'category') arr.sort((a, b) => a.category.localeCompare(b.category, 'de'))
    return arr
  }, [activeItems, sort])

  const detailItem = detailId ? items.find(it => it.id === detailId) : null

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

  function ItemCard({ item }) {
    const badge = expiryBadge(item)
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 ${selectMode ? 'cursor-pointer' : ''}`}
        onClick={() => selectMode ? toggleSelect(item.id) : setDetailId(item.id)}
      >
        <div className="flex items-start gap-3">
          {selectMode && (
            <input type="checkbox" checked={selected.has(item.id)} readOnly
              className="mt-1 rounded" />
          )}
          {item.photoData && (
            <img src={item.photoData} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{item.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{catLabel(item.category)}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-500">{item.quantity}× {item.unit}</span>
              {badge && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span>}
              {item.needsRestock && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">🛒</span>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">📦 Vorratskammer</p>
            <p className="text-xs text-gray-400">
              {activeItems.length} Eintrag{activeItems.length === 1 ? '' : 'e'} · {locations.length} Lagerort{locations.length === 1 ? '' : 'e'}
              {disposedItems.length > 0 && ` · ${disposedItems.length} entsorgt`}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setSelectMode(m => !m); setSelected(new Set()) }}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${selectMode ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
            >
              {selectMode ? 'Fertig' : 'Auswählen'}
            </button>
            <button onClick={() => setShowSettings(true)}
              className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full text-xs font-semibold">
              ⚙️
            </button>
          </div>
        </div>
      </div>

      <SubTabs
        tabs={[
          { id: 'bestand', label: 'Bestand' },
          { id: 'lager', label: 'Lager' },
          ...(disposedItems.length > 0 ? [{ id: 'entsorgt', label: `Entsorgt (${disposedItems.length})` }] : []),
        ]}
        active={tab} onChange={setTab}
      />

      {tab === 'bestand' && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-3">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="text-xs bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1.5 text-gray-600 dark:text-gray-300 font-semibold">
              <option value="name">A–Z</option>
              <option value="mhd">MHD</option>
              <option value="category">Kategorie</option>
            </select>
          </div>

          {selectMode && selected.size > 0 && (
            <SelectionBar count={selected.size}
              onDelete={() => { bulkDeleteItems([...selected]); setSelected(new Set()); setSelectMode(false) }}
              onCancel={() => { setSelected(new Set()); setSelectMode(false) }}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {sorted.map(item => <ItemCard key={item.id} item={item} />)}
          </div>

          {activeItems.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-sm">Noch keine Vorräte erfasst.</p>
              <button onClick={() => openForm()} className="mt-3 text-primary-600 font-semibold text-sm">
                + Ersten Vorrat anlegen
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'lager' && (
        <div className="px-3 py-2">
          {locations.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3">
              {locations.map(l => (
                <button key={l.id}
                  onClick={() => setActiveLocationId(l.id)}
                  className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold ${activeLocationId === l.id
                    ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                  {l.emoji} {l.label}
                </button>
              ))}
            </div>
          )}

          {shelvesOfActive.map(shelf => {
            const shelfItems = byShelf[shelf.id] || []
            return (
              <div key={shelf.id} className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1.5 px-1">
                  {shelf.label} ({shelfItems.length})
                </p>
                <div className="space-y-2">
                  {shelfItems.map(item => <ItemCard key={item.id} item={item} />)}
                  {shelfItems.length === 0 && (
                    <button onClick={() => openForm({ locationId: activeLocation?.id, shelfId: shelf.id })}
                      className="w-full text-xs text-gray-400 py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-400 hover:text-primary-600">
                      + Vorrat hinzufügen
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail-Overlay */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setDetailId(null) }}>
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{detailItem.name}</h2>
              <button onClick={() => setDetailId(null)} className="text-gray-400 hover:text-gray-600 text-xl px-2">✕</button>
            </div>

            {detailItem.photoData && (
              <img src={detailItem.photoData} className="w-full rounded-2xl max-h-48 object-cover" alt="" />
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400">Kategorie:</span> <span className="text-gray-700 dark:text-gray-200">{catLabel(detailItem.category)}</span></div>
              <div><span className="text-gray-400">Menge:</span> <span className="text-gray-700 dark:text-gray-200">{detailItem.quantity}× {detailItem.unit}</span></div>
              {detailItem.bestBefore && (
                <div><span className="text-gray-400">MHD:</span> <span className="text-gray-700 dark:text-gray-200">{new Date(detailItem.bestBefore).toLocaleDateString('de-DE')}</span></div>
              )}
              {detailItem.locationId && (() => {
                const loc = locations.find(l => l.id === detailItem.locationId)
                const shelf = loc?.shelves.find(sh => sh.id === detailItem.shelfId)
                return (
                  <div><span className="text-gray-400">Lagerort:</span> <span className="text-gray-700 dark:text-gray-200">{loc?.emoji} {loc?.label}{shelf ? ` / ${shelf.label}` : ''}</span></div>
                )
              })()}
            </div>

            {detailItem.note && (
              <p className="text-sm text-gray-500 italic">{detailItem.note}</p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <QRLabel item={detailItem} appUrl={APP_URL} />
              <button onClick={() => { toggleRestock(detailItem.id) }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${detailItem.needsRestock
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                🛒 {detailItem.needsRestock ? 'Nachkauf ✓' : 'Nachkaufen'}
              </button>
              <button onClick={() => setDisposeTarget(detailItem)}
                className="flex items-center gap-1.5 text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full font-semibold hover:bg-orange-100 dark:hover:bg-orange-900/50">
                🗑️ Entsorgen
              </button>
              <button onClick={() => { if (confirm(`"${detailItem.name}" endgültig löschen?`)) { removeItem(detailItem.id); setDetailId(null) } }}
                className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full font-semibold hover:bg-red-100 dark:hover:bg-red-900/50">
                ✕ Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'entsorgt' && (
        <div className="px-3 py-2">
          {disposedItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Keine entsorgten Einträge.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {disposedItems.map(item => {
                const reason = DISPOSAL_REASONS.find(r => r.id === item.disposalReason)
                return (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 opacity-70">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate line-through">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{catLabel(item.category)}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                            {reason ? `${reason.emoji} ${reason.label}` : item.disposalReason}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(item.disposedAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => { if (confirm(`"${item.name}" endgültig löschen?`)) removeItem(item.id) }}
                        className="text-gray-300 hover:text-red-500 px-2 text-sm">✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Entsorgen-Dialog */}
      {disposeTarget && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end sm:items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setDisposeTarget(null) }}>
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 space-y-4">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
              „{disposeTarget.name}" entsorgen
            </h3>
            <p className="text-sm text-gray-500">Warum wird der Vorrat entsorgt?</p>
            <div className="grid grid-cols-2 gap-2">
              {DISPOSAL_REASONS.map(reason => (
                <button key={reason.id}
                  onClick={() => {
                    disposeItem(disposeTarget.id, reason.id)
                    setDisposeTarget(null)
                    setDetailId(null)
                  }}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
                  <span>{reason.emoji}</span>
                  <span>{reason.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setDisposeTarget(null)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 py-2.5 rounded-2xl font-semibold text-sm">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {formOpen && <PantryForm prefilled={formPrefill} onClose={closeForm} />}

      {!formOpen && (
        <button onClick={() => openForm()}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary-600 text-white text-2xl shadow-lg hover:bg-primary-700 z-30"
          aria-label="Neuen Vorrat erfassen">
          +
        </button>
      )}
    </div>
  )
}
