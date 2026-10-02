import { useState, useRef, useMemo } from 'react'
import { usePantry, CATEGORIES, autoCategory } from './store'
import AutocompleteInput from '../../components/AutocompleteInput'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { showToast } from '../../ui/feedback'

const UNITS = ['Stück', 'Packung', 'Dose', 'Glas', 'Beutel', 'Flasche', 'kg', 'g', 'ml', 'l']

// prefilled mit `id` = bestehenden Eintrag bearbeiten, sonst neu anlegen (ggf. vorbelegt)
export default function PantryForm({ prefilled, onClose }) {
  const { locations, items, addItem, updateItem } = usePantry()
  const nameSuggestions = useMemo(() => [...new Set(items.map(i => i.name).filter(Boolean))].sort(), [items])
  const editing = !!prefilled?.id

  const startLocationId = editing ? (prefilled.locationId || '') : (prefilled?.locationId || locations[0]?.id || '')
  const startShelfId = editing ? (prefilled.shelfId || '')
    : (prefilled?.shelfId || locations.find(l => l.id === startLocationId)?.shelves[0]?.id || '')

  const [name, setName] = useState(prefilled?.name || '')
  const [category, setCategory] = useState(prefilled?.category || autoCategory(prefilled?.name || '') || 'sonstiges')
  const [autoCat, setAutoCat] = useState(!editing)
  const [locationId, setLocationId] = useState(startLocationId)
  const [shelfId, setShelfId] = useState(startShelfId)
  const [quantity, setQuantity] = useState(prefilled?.quantity || 1)
  const [unit, setUnit] = useState(prefilled?.unit || 'Stück')
  const [bestBefore, setBestBefore] = useState(prefilled?.bestBefore || '')
  const [note, setNote] = useState(prefilled?.note || '')
  const [photoData, setPhotoData] = useState(prefilled?.photoData || null)
  const [bulkMode, setBulkMode] = useState(false)
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
    if (editing) {
      updateItem(prefilled.id, {
        name: name.trim(), category, locationId, shelfId,
        quantity: Math.max(1, Number(quantity) || 1), unit, bestBefore, note, photoData,
      })
      onClose()
      return
    }
    addItem({ name, category, locationId, shelfId, quantity, unit, bestBefore, note, photoData })
    if (bulkMode) {
      showToast(`„${name.trim()}“ gespeichert – weiter mit dem nächsten.`, { duration: 2500 })
      setName(''); setCategory('sonstiges'); setAutoCat(true)
      setQuantity(1); setBestBefore(''); setNote(''); setPhotoData(null)
    } else {
      onClose()
    }
  }

  return (
    <Sheet title={editing ? 'Vorrat bearbeiten' : 'Neuer Vorrat'} onClose={onClose}
      confirmLabel="Sichern" onConfirm={save} confirmDisabled={!name.trim()}>
      <div className="px-4 space-y-4">
        <Block>
          <label className="label" htmlFor="pantry-name">Name</label>
          <AutocompleteInput id="pantry-name" value={name} onChange={handleNameChange} suggestions={nameSuggestions}
            placeholder="z. B. Dinkelmehl Type 630" className="input" autoFocus={!editing} />
        </Block>

        <Block>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="pantry-cat">Kategorie</label>
              <select id="pantry-cat" value={category} onChange={e => { setCategory(e.target.value); setAutoCat(false) }} className="input">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pantry-mhd">Haltbar bis</label>
              <input id="pantry-mhd" type="date" value={bestBefore} onChange={e => setBestBefore(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="pantry-qty">Menge</label>
              <input id="pantry-qty" type="number" inputMode="numeric" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="pantry-unit">Einheit</label>
              <select id="pantry-unit" value={unit} onChange={e => setUnit(e.target.value)} className="input">
                {[...new Set([...UNITS, unit])].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </Block>

        {locations.length > 0 && (
          <Block>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="pantry-loc">Lagerort</label>
                <select id="pantry-loc" value={locationId} onChange={e => {
                  setLocationId(e.target.value)
                  const loc = locations.find(l => l.id === e.target.value)
                  setShelfId(loc?.shelves[0]?.id || '')
                }} className="input">
                  <option value="">— kein Ort —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.emoji} {l.label}</option>)}
                </select>
              </div>
              {shelves.length > 0 && (
                <div>
                  <label className="label" htmlFor="pantry-shelf">Fach</label>
                  <select id="pantry-shelf" value={shelfId} onChange={e => setShelfId(e.target.value)} className="input">
                    {!shelves.some(sh => sh.id === shelfId) && <option value={shelfId}>— kein Fach —</option>}
                    {shelves.map(sh => <option key={sh.id} value={sh.id}>{sh.label}</option>)}
                  </select>
                </div>
              )}
            </div>
          </Block>
        )}

        <Block>
          <label className="label" htmlFor="pantry-note">Notiz</label>
          <input id="pantry-note" value={note} onChange={e => setNote(e.target.value)}
            placeholder="z. B. geöffnet, Restmenge …" className="input" />
        </Block>

        <Block>
          <span className="label">Foto (z. B. Originalverpackung)</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => photoRef.current?.click()} className="btn-secondary flex-1">
              <Icon name="camera" size={20} />{photoData ? 'Foto ändern' : 'Foto aufnehmen'}
            </button>
            {photoData && (
              <>
                <img src={photoData} className="h-12 w-12 rounded-lg object-cover flex-none" alt="Vorschau" />
                <button type="button" onClick={() => setPhotoData(null)} aria-label="Foto entfernen"
                  className="w-11 h-11 flex-none flex items-center justify-center text-gray-400">
                  <Icon name="trash" size={20} />
                </button>
              </>
            )}
            <input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} hidden />
          </div>
        </Block>

        {!editing && (
          <label className="flex items-center gap-3 min-h-[50px] px-4 bg-white dark:bg-gray-800 rounded-card cursor-pointer">
            <span className="flex-1">
              <span className="block text-body font-semibold text-gray-900 dark:text-gray-100">Mehrere erfassen</span>
              <span className="block text-footnote text-gray-500 dark:text-gray-400">Formular bleibt nach dem Sichern offen</span>
            </span>
            <input type="checkbox" checked={bulkMode} onChange={e => setBulkMode(e.target.checked)}
              className="w-6 h-6 accent-primary-500" />
          </label>
        )}

        <button onClick={save} disabled={!name.trim()} className="btn-primary w-full">
          {editing ? 'Änderungen sichern' : bulkMode ? 'Sichern & nächster' : 'Vorrat sichern'}
        </button>
      </div>
    </Sheet>
  )
}

function Block({ children }) {
  return <div className="bg-white dark:bg-gray-800 rounded-card p-4">{children}</div>
}
