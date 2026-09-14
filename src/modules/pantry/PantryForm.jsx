import { useState, useRef, useMemo } from 'react'
import { usePantry, CATEGORIES, autoCategory } from './store'
import AutocompleteInput from '../../components/AutocompleteInput'

export default function PantryForm({ prefilled, onClose }) {
  const { locations, items, addItem } = usePantry()
  const nameSuggestions = useMemo(() => [...new Set(items.map(i => i.name).filter(Boolean))].sort(), [items])

  const startLocationId = prefilled?.locationId || locations[0]?.id || ''
  const startShelfId = prefilled?.shelfId || locations.find(l => l.id === startLocationId)?.shelves[0]?.id || ''

  const [name, setName] = useState(prefilled?.name || '')
  const [category, setCategory] = useState(prefilled?.category || autoCategory(prefilled?.name || '') || 'sonstiges')
  const [autoCat, setAutoCat] = useState(true)
  const [locationId, setLocationId] = useState(startLocationId)
  const [shelfId, setShelfId] = useState(startShelfId)
  const [quantity, setQuantity] = useState(prefilled?.quantity || 1)
  const [unit, setUnit] = useState(prefilled?.unit || 'Stück')
  const [bestBefore, setBestBefore] = useState(prefilled?.bestBefore || '')
  const [note, setNote] = useState(prefilled?.note || '')
  const [photoData, setPhotoData] = useState(prefilled?.photoData || null)
  const [bulkMode, setBulkMode] = useState(false)
  const [hint, setHint] = useState('')
  const photoRef = useRef(null)

  const location = locations.find(l => l.id === locationId)
  const shelves = location?.shelves || []

  function handleNameChange(v) {
    setName(v)
    if (autoCat && v.trim()) setCategory(autoCategory(v))
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    const url = URL.createObjectURL(file)
    await new Promise(res => { img.onload = res; img.src = url })
    const canvas = document.createElement('canvas')
    const max = 800
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    setPhotoData(canvas.toDataURL('image/jpeg', 0.7))
    URL.revokeObjectURL(url)
  }

  function save() {
    if (!name.trim()) return
    addItem({ name, category, locationId, shelfId, quantity, unit, bestBefore, note, photoData })
    if (bulkMode) {
      setHint(`✓ ${name} gespeichert`)
      setName(''); setCategory('sonstiges'); setAutoCat(true)
      setQuantity(1); setBestBefore(''); setNote(''); setPhotoData(null)
      setTimeout(() => setHint(''), 2000)
    } else {
      onClose()
    }
  }

  const UNITS = ['Stück', 'Packung', 'Dose', 'Glas', 'Beutel', 'Flasche', 'kg', 'g', 'ml', 'l']

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            📦 {prefilled ? 'Vorrat bearbeiten' : 'Neuer Vorrat'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl px-2">✕</button>
        </div>

        {hint && <p className="text-center text-sm text-emerald-600 font-semibold">{hint}</p>}

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Name</label>
          <AutocompleteInput value={name} onChange={handleNameChange} suggestions={nameSuggestions}
            placeholder="z.B. Dinkelmehl Type 630" className="input mt-1" autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Kategorie</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setAutoCat(false) }}
              className="input mt-1">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">MHD</label>
            <input type="date" value={bestBefore} onChange={e => setBestBefore(e.target.value)}
              className="input mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Menge</label>
            <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))}
              className="input mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Einheit</label>
            <select value={unit} onChange={e => setUnit(e.target.value)} className="input mt-1">
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {locations.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Lagerort</label>
              <select value={locationId} onChange={e => {
                setLocationId(e.target.value)
                const loc = locations.find(l => l.id === e.target.value)
                setShelfId(loc?.shelves[0]?.id || '')
              }} className="input mt-1">
                <option value="">— kein Ort —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.emoji} {l.label}</option>)}
              </select>
            </div>
            {shelves.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Fach</label>
                <select value={shelfId} onChange={e => setShelfId(e.target.value)} className="input mt-1">
                  {shelves.map(sh => <option key={sh.id} value={sh.id}>{sh.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Notiz</label>
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="z.B. geöffnet, Restmenge ..." className="input mt-1" />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase">Foto (z.B. Originalverpackung)</label>
          <div className="mt-1 flex items-center gap-3">
            <button onClick={() => photoRef.current?.click()}
              className="bg-gray-100 dark:bg-gray-700 text-gray-500 px-4 py-2 rounded-xl text-sm font-semibold">
              📷 {photoData ? 'Foto ändern' : 'Foto hinzufügen'}
            </button>
            {photoData && (
              <img src={photoData} className="h-12 w-12 rounded-lg object-cover" alt="Vorschau" />
            )}
            <input ref={photoRef} type="file" accept="image/*" capture="environment"
              onChange={handlePhoto} hidden />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={bulkMode} onChange={e => setBulkMode(e.target.checked)}
              className="rounded" />
            Mehrere erfassen
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold py-3 rounded-2xl">
            Abbrechen
          </button>
          <button onClick={save} disabled={!name.trim()}
            className="flex-1 btn-primary py-3 rounded-2xl font-semibold disabled:opacity-40">
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
