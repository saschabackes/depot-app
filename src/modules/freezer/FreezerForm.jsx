import { useState, useRef, useMemo } from 'react'
import { useFreezer, CATEGORIES, FREEZER_SHELF_LIFE, autoCategory } from './store'
import AutocompleteInput from '../../components/AutocompleteInput'
import { localISODate } from '../../utils/date'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow } from '../../ui/List'
import { showToast } from '../../ui/feedback'
import { Switch, Stepper, FieldRow, InlineSelect } from './parts'

// Gleiche Berechnung wie im Store (calcExpiry)
function expiryFor(category, frozenAt) {
  const d = new Date(frozenAt); d.setUTCDate(d.getUTCDate() + (FREEZER_SHELF_LIFE[category] ?? 180))
  return d.toISOString().slice(0, 10)
}

// Anlegen (prefilled) oder Bearbeiten (item)
export default function FreezerForm({ prefilled, item, onClose }) {
  const { storages, items, addItem, updateItem, removePending, lastUsedCompartment } = useFreezer()
  const editing = !!item
  const nameSuggestions = useMemo(() => [...new Set(items.map(i => i.name).filter(Boolean))].sort(), [items])
  const portionSizeSuggestions = useMemo(() => [...new Set(items.map(i => i.portionSize).filter(Boolean))].sort(), [items])
  const startStorageId = item?.storageId || prefilled?.storageId || lastUsedCompartment?.storageId || storages[0]?.id
  const startCompartmentId = item?.compartmentId || prefilled?.compartmentId || lastUsedCompartment?.compartmentId
    || storages.find(s => s.id === startStorageId)?.compartments[0]?.id
  const pendingId = prefilled?.pendingId || null

  const [name, setName] = useState(item?.name ?? prefilled?.name ?? '')
  const [category, setCategory] = useState(item?.category || prefilled?.category || autoCategory(prefilled?.name || '') || 'sonstiges')
  const [autoCat, setAutoCat] = useState(!editing)
  const [storageId, setStorageId] = useState(startStorageId)
  const [compartmentId, setCompartmentId] = useState(startCompartmentId)
  const [portions, setPortions] = useState(item?.portions ?? 1)
  const [portionSize, setPortionSize] = useState(item?.portionSize ?? prefilled?.portionSize ?? '')
  const [frozenAt, setFrozenAt] = useState(item?.frozenAt || localISODate())
  const [note, setNote] = useState(item?.note ?? '')
  const [photoData, setPhotoData] = useState(item?.photoData ?? prefilled?.photoData ?? null)
  const [bulkMode, setBulkMode] = useState(false)
  const photoRef = useRef(null)

  const storage = storages.find(s => s.id === storageId)
  const compartments = storage?.compartments || []
  const shelfMonths = Math.round((FREEZER_SHELF_LIFE[category] ?? 180) / 30)

  function handleNameChange(v) {
    setName(v)
    if (autoCat && v.trim()) setCategory(autoCategory(v))
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // Auf max 800px komprimieren als JPEG-DataURL
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
    e.target.value = ''
  }

  function save() {
    if (!name.trim()) return
    if (editing) {
      const patch = { name: name.trim(), category, storageId, compartmentId, portions: Math.max(1, Number(portions) || 1), portionSize, note, frozenAt, photoData }
      if (frozenAt && (category !== item.category || frozenAt !== item.frozenAt)) patch.expiryDate = expiryFor(category, frozenAt)
      updateItem(item.id, patch)
      onClose()
      return
    }
    addItem({ name, category, storageId, compartmentId, portions, portionSize, frozenAt, note, photoData })
    if (pendingId) removePending(pendingId)
    if (bulkMode) {
      showToast(`„${name.trim()}“ gespeichert – nächster Eintrag?`, { duration: 2500 })
      setName(''); setPortions(1); setPortionSize(''); setNote(''); setPhotoData(null)
      if (autoCat) setCategory('sonstiges')
    } else {
      onClose()
    }
  }

  const title = editing ? 'Bearbeiten' : pendingId ? 'Einräumen' : 'Einfrieren'

  return (
    <Sheet title={title} onClose={onClose} confirmLabel="Sichern" onConfirm={save} confirmDisabled={!name.trim()}>
      <div className="space-y-5">
        <div className="px-4 space-y-3">
          <div>
            <label className="label">Was?</label>
            <AutocompleteInput className="input" placeholder="z. B. Hähnchenbrust, Lasagne"
              value={name} onChange={handleNameChange} suggestions={nameSuggestions} autoFocus={!editing} />
          </div>
          <div>
            <label className="label">Portionsgröße</label>
            <AutocompleteInput className="input" placeholder="z. B. 150 g, Stück, Glas"
              value={portionSize} onChange={setPortionSize} suggestions={portionSizeSuggestions} />
          </div>
        </div>

        <ListGroup title="Menge & Lagerort">
          <FieldRow label="Portionen">
            <Stepper value={portions} onChange={setPortions} label="Portionen" />
          </FieldRow>
          <FieldRow label="Gefrierschrank">
            <InlineSelect label="Gefrierschrank" value={storageId}
              onChange={id => { setStorageId(id); setCompartmentId(storages.find(s => s.id === id)?.compartments[0]?.id) }}>
              {storages.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
            </InlineSelect>
          </FieldRow>
          {compartments.length > 0 && (
            <FieldRow label="Fach">
              <InlineSelect label="Fach" value={compartmentId} onChange={setCompartmentId}>
                {compartments.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </InlineSelect>
            </FieldRow>
          )}
          <FieldRow label="Eingefroren am">
            <input type="date" value={frozenAt} onChange={e => setFrozenAt(e.target.value)} aria-label="Eingefroren am"
              className="bg-transparent text-right text-body text-gray-500 dark:text-gray-400 outline-none py-2" />
          </FieldRow>
        </ListGroup>

        <ListGroup title="Kategorie" footer={`Empfohlene Haltbarkeit: etwa ${shelfMonths} Monate`}>
          <FieldRow label="Kategorie">
            <InlineSelect label="Kategorie" value={category} onChange={id => { setAutoCat(false); setCategory(id) }}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </InlineSelect>
          </FieldRow>
          <FieldRow label="Automatisch aus Name">
            <Switch checked={autoCat} onChange={v => { setAutoCat(v); if (v && name.trim()) setCategory(autoCategory(name)) }} label="Kategorie automatisch aus Name" />
          </FieldRow>
        </ListGroup>

        <ListGroup title="Foto" footer="Gut für selbst Eingemachtes, Hundefutter und alles ohne Etikett.">
          <input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          <ListRow onClick={() => photoRef.current?.click()} tone="accent"
            leading={photoData
              ? <img src={photoData} alt="" className="w-11 h-11 rounded-[10px] object-cover flex-none" />
              : <Icon name="camera" size={22} className="text-primary-500 dark:text-primary-300" />}
            title={photoData ? 'Foto ersetzen' : 'Foto aufnehmen'} />
          {photoData && <ListRow onClick={() => setPhotoData(null)} tone="danger" title="Foto entfernen" />}
        </ListGroup>

        <div className="px-4">
          <label className="label">Notiz</label>
          <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="optional" />
        </div>

        {!editing && (
          <ListGroup footer="Das Formular bleibt nach dem Sichern offen – praktisch nach dem Wocheneinkauf.">
            <FieldRow label="Mehrere nacheinander">
              <Switch checked={bulkMode} onChange={setBulkMode} label="Mehrere nacheinander erfassen" />
            </FieldRow>
          </ListGroup>
        )}
      </div>
    </Sheet>
  )
}
