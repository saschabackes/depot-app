import { useState } from 'react'
import useStore from '../store/useStore'
import { CATEGORY_COLORS } from '../data/spices'
import StatsView from './StatsView'
import Sheet from '../ui/Sheet'
import { confirmAction } from '../ui/feedback'

export default function SpiceSettings({ onClose }) {
  return (
    <Sheet title="Gewürz-Einstellungen" onClose={onClose} cancelLabel="Schließen">
      <div className="px-4 space-y-7">
        <LocationsSection />
        <CategoriesSection />
        <div>
          <h3 className="px-1 pb-2 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Statistik</h3>
          <StatsView />
        </div>
      </div>
    </Sheet>
  )
}

// ── Lagerorte ─────────────────────────────────────────────────────────────────

function LocationsSection() {
  const { locations, spices, addLocation, updateLocation, deleteLocation, reorderLocations } = useStore()
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    addLocation({ name: newName.trim(), description: newDesc.trim(), sortOrder: locations.length })
    setNewName('')
    setNewDesc('')
  }

  function move(idx, dir) {
    const next = [...locations]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    reorderLocations(next)
  }

  function startEdit(loc) {
    setEditingId(loc.id)
    setEditName(loc.name)
    setEditDesc(loc.description)
  }

  function saveEdit(id) {
    if (editName.trim()) {
      updateLocation(id, { name: editName.trim(), description: editDesc.trim(), sortOrder: locations.find(l => l.id === id)?.sortOrder ?? 0 })
    }
    setEditingId(null)
  }

  async function handleDelete(loc) {
    const count = spices.filter(s => s.locationId === loc.id).length
    const msg = count > 0
      ? `"${loc.name}" löschen? ${count} Gewürz${count !== 1 ? 'e verlieren' : ' verliert'} die Lagerort-Zuweisung.`
      : `"${loc.name}" wirklich löschen?`
    if (await confirmAction({ title: msg, confirmLabel: 'Löschen', destructive: true })) deleteLocation(loc.id)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="px-1 pb-2 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Lagerorte</h3>
        {locations.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 font-medium">{locations.length} Orte</span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {locations.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Noch keine Lagerorte angelegt.</p>
        )}
        {locations.map(loc => {
          const count = spices.filter(s => s.locationId === loc.id).length
          if (editingId === loc.id) {
            return (
              <div key={loc.id} className="card p-3 space-y-2 ring-2 ring-primary-500">
                <input type="text" className="input py-2 text-sm" value={editName}
                  onChange={e => setEditName(e.target.value)} placeholder="Name" autoFocus />
                <input type="text" className="input py-2 text-sm" value={editDesc}
                  onChange={e => setEditDesc(e.target.value)} placeholder="Beschreibung (optional)" />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(loc.id)} className="btn-primary flex-1 py-2 text-sm">Speichern</button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 py-2 text-sm">Abbrechen</button>
                </div>
              </div>
            )
          }
          return (
            <div key={loc.id} className="card px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-soon-soft dark:bg-soon-dark-soft rounded-lg flex items-center justify-center flex-none">
                <svg className="w-4 h-4 text-soon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{loc.name}</div>
                {loc.description && <div className="text-xs text-gray-400">{loc.description}</div>}
                <div className="text-xs text-gray-400 mt-0.5">
                  {count === 0 ? 'Keine Gewürze' : `${count} Gewürz${count !== 1 ? 'e' : ''}`}
                </div>
              </div>
              <div className="flex gap-0.5 flex-none">
                {locations.length > 1 && (
                  <div className="flex flex-col">
                    <button onClick={() => move(locations.indexOf(loc), -1)} disabled={locations.indexOf(loc) === 0}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-20 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button onClick={() => move(locations.indexOf(loc), 1)} disabled={locations.indexOf(loc) === locations.length - 1}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-20 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
                <button onClick={() => startEdit(loc)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button onClick={() => handleDelete(loc)}
                  className="p-1.5 rounded-lg hover:bg-expired-soft dark:hover:bg-expired-dark-soft text-gray-400 hover:text-expired transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleAdd} className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Neuer Lagerort</p>
        <input type="text" className="input py-2.5 text-sm" placeholder="z.B. Oberschrank links, Kiste 1…"
          value={newName} onChange={e => setNewName(e.target.value)} />
        <input type="text" className="input py-2.5 text-sm" placeholder="Beschreibung (optional)"
          value={newDesc} onChange={e => setNewDesc(e.target.value)} />
        <button type="submit" className="btn-primary w-full" disabled={!newName.trim()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Lagerort hinzufügen
        </button>
      </form>
    </div>
  )
}

// ── Kategorien ────────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(CATEGORY_COLORS).map(([key, cls]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          title={key}
          className={`w-7 h-7 rounded-full transition-all ${cls.bg} border-2 ${
            value === key
              ? 'border-gray-500 scale-110 shadow'
              : 'border-transparent hover:scale-105'
          }`}
        />
      ))}
    </div>
  )
}

function CategoriesSection() {
  const { categories, spices, addCategory, updateCategory, deleteCategory } = useStore()
  const [newName, setNewName]   = useState('')
  const [newColor, setNewColor] = useState('green')
  const [editingId, setEditingId]   = useState(null)
  const [editName, setEditName]     = useState('')
  const [editColor, setEditColor]   = useState('green')

  function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    addCategory({ name: newName.trim(), color: newColor, sortOrder: categories.length })
    setNewName('')
    setNewColor('green')
  }

  function startEdit(cat) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  function saveEdit(id) {
    if (editName.trim()) updateCategory(id, { name: editName.trim(), color: editColor })
    setEditingId(null)
  }

  async function handleDelete(cat) {
    const count = spices.filter(s => s.category === cat.id).length
    const msg = count > 0
      ? `"${cat.name}" löschen? ${count} Gewürz${count !== 1 ? 'e verlieren' : ' verliert'} die Kategorie-Zuweisung.`
      : `"${cat.name}" wirklich löschen?`
    if (await confirmAction({ title: msg, confirmLabel: 'Löschen', destructive: true })) deleteCategory(cat.id)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <h3 className="px-1 pb-2 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Kategorien</h3>
        {categories.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 font-medium">{categories.length} Kategorien</span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Noch keine Kategorien angelegt.</p>
        )}
        {categories.map(cat => {
          const count = spices.filter(s => s.category === cat.id).length
          const cls   = CATEGORY_COLORS[cat.color] ?? CATEGORY_COLORS.gray
          if (editingId === cat.id) {
            return (
              <div key={cat.id} className="card p-3 space-y-3 ring-2 ring-primary-500">
                <input
                  type="text"
                  className="input py-2 text-sm"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Name"
                  autoFocus
                />
                <div>
                  <p className="text-xs text-gray-400 mb-2">Farbe</p>
                  <ColorPicker value={editColor} onChange={setEditColor} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(cat.id)} className="btn-primary flex-1 py-2 text-sm">Speichern</button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary flex-1 py-2 text-sm">Abbrechen</button>
                </div>
              </div>
            )
          }
          return (
            <div key={cat.id} className="card px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 ${cls.bg} rounded-lg flex-none`} />
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${cls.text}`}>{cat.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {count === 0 ? 'Keine Gewürze' : `${count} Gewürz${count !== 1 ? 'e' : ''}`}
                </div>
              </div>
              <div className="flex gap-1 flex-none">
                <button
                  onClick={() => startEdit(cat)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:bg-gray-700 text-gray-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 rounded-lg hover:bg-expired-soft dark:bg-expired-dark-soft text-gray-400 hover:text-expired transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleAdd} className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Neue Kategorie</p>
        <input
          type="text"
          className="input py-2.5 text-sm"
          placeholder="z.B. Kräuter, Asiatisch, Scharf…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <div>
          <p className="text-xs text-gray-400 mb-2">Farbe</p>
          <ColorPicker value={newColor} onChange={setNewColor} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={!newName.trim()}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Kategorie hinzufügen
        </button>
      </form>
    </div>
  )
}
