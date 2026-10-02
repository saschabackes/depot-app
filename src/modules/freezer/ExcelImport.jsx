import { useState } from 'react'
import * as XLSX from 'xlsx'
import { useFreezer, CATEGORIES, autoCategory } from './store'
import { TARGETS, autoMapColumns, looksLikeHeader, rowToItem } from './excelMapping'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow } from '../../ui/List'
import { showToast } from '../../ui/feedback'
import { Switch, FieldRow, InlineSelect } from './parts'

export default function ExcelImport({ onClose }) {
  const { storages, addItem } = useFreezer()
  const [step, setStep] = useState('pick')
  const [error, setError] = useState('')
  const [wb, setWb] = useState(null)
  const [sheetName, setSheetName] = useState('')
  const [rawRows, setRawRows] = useState([])
  const [hasHeader, setHasHeader] = useState(true)
  const [mapping, setMapping] = useState([])
  const [targetStorageId, setTargetStorageId] = useState(storages[0]?.id)
  const [targetCompartmentId, setTargetCompartmentId] = useState(storages[0]?.compartments[0]?.id)

  const targetStorage = storages.find(s => s.id === targetStorageId)

  async function handleFile(e) {
    setError('')
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const book = XLSX.read(buf, { type: 'array' })
      setWb(book)
      const first = book.SheetNames[0]
      setSheetName(first)
      loadSheet(book, first)
      setStep('map')
    } catch (err) {
      setError('Datei konnte nicht gelesen werden: ' + err.message)
    }
  }

  function loadSheet(book, name) {
    const ws = book.Sheets[name]
    const arr = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' })
    const maxLen = arr.reduce((m, r) => Math.max(m, r.length), 0)
    const padded = arr.map(r => Array.from({ length: maxLen }, (_, i) => r[i] ?? ''))
    setRawRows(padded)
    const header = padded[0] || []
    const samples = padded.slice(1, 6)
    const headerGuess = looksLikeHeader(header, samples)
    setHasHeader(headerGuess)
    proposeMapping(padded, headerGuess)
  }

  function proposeMapping(rows, withHeader) {
    const header = withHeader ? rows[0] : rows[0].map((_, i) => `Spalte ${i + 1}`)
    const dataRows = withHeader ? rows.slice(1) : rows
    setMapping(autoMapColumns(header, dataRows))
  }

  function changeSheet(name) {
    setSheetName(name)
    loadSheet(wb, name)
  }

  function changeHasHeader(v) {
    setHasHeader(v)
    proposeMapping(rawRows, v)
  }

  function changeMappingTarget(idx, target) {
    setMapping(m => m.map((c, i) => i === idx ? { ...c, target } : c))
  }

  const dataRows = hasHeader ? rawRows.slice(1) : rawRows
  const preview = dataRows.slice(0, 5).map(r => rowToItem(r, mapping))

  function doImport() {
    let n = 0
    const defaultCompartment = targetStorage?.compartments[0]?.id
    dataRows.forEach(r => {
      const item = rowToItem(r, mapping)
      if (!item.name) return

      let storageId = targetStorageId
      let compartmentId = targetCompartmentId || defaultCompartment
      if (item.storageLabel) {
        const match = storages.find(s => s.label.toLowerCase().includes(item.storageLabel.toLowerCase()))
        if (match) {
          storageId = match.id
          if (item.compartment) {
            const cm = match.compartments.find(c => c.label.toLowerCase().includes(item.compartment.toLowerCase()))
            if (cm) compartmentId = cm.id
          } else {
            compartmentId = match.compartments[0]?.id
          }
        }
      }

      const category = item.category || autoCategory(item.name)
      addItem({
        name: item.name,
        category,
        portions: item.portions,
        portionSize: item.portionSize,
        frozenAt: item.frozenAt || undefined,
        storageId,
        compartmentId,
        note: item.note,
      })
      n++
    })
    showToast(`${n} ${n === 1 ? 'Eintrag' : 'Einträge'} importiert.`)
    onClose()
  }

  const catLabel = (id) => CATEGORIES.find(c => c.id === id)?.label || id

  const importable = dataRows.filter(r => rowToItem(r, mapping).name).length

  return (
    <Sheet title="Excel-Import" onClose={onClose} z={60}
      confirmLabel={step === 'map' ? 'Importieren' : undefined} onConfirm={doImport} confirmDisabled={!importable}>
      {step === 'pick' && (
        <div className="flex flex-col items-center text-center px-8 py-10 gap-3">
          <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-[#2F6690] dark:text-[#8DBBE0] flex items-center justify-center"><Icon name="inbox" size={30} /></span>
          <h3 className="text-headline text-gray-900 dark:text-gray-100">Liste aus Excel übernehmen</h3>
          <p className="text-callout text-gray-500 dark:text-gray-400 max-w-sm">
            Lade eine .xlsx- oder .csv-Datei mit deinen TK-Einträgen hoch. Die Spalten werden automatisch erkannt,
            du kannst die Zuordnung danach anpassen.
          </p>
          <label className="btn-primary px-6 mt-2 cursor-pointer">
            <Icon name="inbox" size={20} />Datei auswählen
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </label>
          {error && <p className="text-callout text-expired dark:text-expired-dark">{error}</p>}
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-5">
          <ListGroup footer={`${rawRows.length} Zeilen gelesen · ${importable} mit Namen werden importiert`}>
            {wb?.SheetNames?.length > 1 && (
              <FieldRow label="Arbeitsblatt">
                <InlineSelect label="Arbeitsblatt" value={sheetName} onChange={changeSheet}>
                  {wb.SheetNames.map(n => <option key={n} value={n}>{n}</option>)}
                </InlineSelect>
              </FieldRow>
            )}
            <FieldRow label="Erste Zeile = Spaltennamen">
              <Switch checked={hasHeader} onChange={changeHasHeader} label="Erste Zeile enthält Spaltennamen" />
            </FieldRow>
          </ListGroup>

          <ListGroup title="Spalten zuordnen" footer="Automatisch zugeordnet – bitte prüfen und ggf. korrigieren.">
            {mapping.map((m, i) => (
              <div key={i} className="px-4 py-2.5 min-h-[50px]">
                <div className="flex items-center gap-3">
                  <span className="flex-1 min-w-0 truncate text-body font-semibold text-gray-900 dark:text-gray-100">{m.header || `Spalte ${i + 1}`}</span>
                  <InlineSelect label={`Ziel für ${m.header || `Spalte ${i + 1}`}`} value={m.target} onChange={v => changeMappingTarget(i, v)}>
                    {TARGETS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </InlineSelect>
                </div>
                {m.samples.length > 0 && (
                  <p className="text-footnote text-gray-500 dark:text-gray-400 truncate">z. B. {m.samples.map(String).join(' · ')}</p>
                )}
              </div>
            ))}
          </ListGroup>

          <ListGroup title="Vorschau">
            {preview.map((item, i) => (
              <ListRow key={i}
                title={item.name || <span className="text-expired dark:text-expired-dark">Kein Name – wird übersprungen</span>}
                subtitle={[
                  item.portions > 1 || item.portionSize ? `${item.portions || 1} × ${item.portionSize || 'Portion'}` : null,
                  item.category && catLabel(item.category),
                  item.frozenAt && `eingefroren ${item.frozenAt}`,
                  item.storageLabel && [item.storageLabel, item.compartment].filter(Boolean).join(' / '),
                ].filter(Boolean).join(' · ')} />
            ))}
          </ListGroup>

          <ListGroup title="Ziel ohne Ortsangabe" footer="Für Zeilen, deren Gefrierschrank nicht erkannt wird.">
            <FieldRow label="Gefrierschrank">
              <InlineSelect label="Gefrierschrank" value={targetStorageId}
                onChange={id => { setTargetStorageId(id); setTargetCompartmentId(storages.find(s => s.id === id)?.compartments[0]?.id) }}>
                {storages.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
              </InlineSelect>
            </FieldRow>
            {targetStorage?.compartments.length > 0 && (
              <FieldRow label="Fach">
                <InlineSelect label="Fach" value={targetCompartmentId} onChange={setTargetCompartmentId}>
                  {targetStorage.compartments.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </InlineSelect>
              </FieldRow>
            )}
          </ListGroup>
        </div>
      )}
    </Sheet>
  )
}
