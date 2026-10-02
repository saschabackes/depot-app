import { useState } from 'react'
import * as XLSX from 'xlsx'
import { useCellar } from './store'
import { TARGETS, autoMapColumns, looksLikeHeader, rowToWine } from './excelMapping'
import { FormSection } from './cellarUi'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow } from '../../ui/List'

export default function ExcelImport({ onClose, onImported }) {
  const { racks, addPendingBatch, addRack, setRackGrid, addBottle } = useCellar()
  const [step, setStep] = useState('pick')   // pick | sheet | map | confirm
  const [error, setError] = useState('')
  const [wb, setWb] = useState(null)
  const [sheetName, setSheetName] = useState('')
  const [rawRows, setRawRows] = useState([])
  const [hasHeader, setHasHeader] = useState(true)
  const [mapping, setMapping] = useState([])

  async function handleFile(e) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const book = XLSX.read(buf, { type: 'array' })
      setWb(book)
      const first = book.SheetNames[0]
      setSheetName(first)
      loadSheet(book, first)
      setStep('sheet')
    } catch (err) {
      setError('Datei konnte nicht gelesen werden: ' + err.message)
    }
  }

  function loadSheet(book, name) {
    const ws = book.Sheets[name]
    const arr = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' })
    // Leere Spalten am Ende kappen
    const maxLen = arr.reduce((m, r) => Math.max(m, r.length), 0)
    const padded = arr.map(r => Array.from({ length: maxLen }, (_, i) => r[i] ?? ''))
    setRawRows(padded)
    // Header-Vermutung
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
  const preview = dataRows.slice(0, 5).map(r => rowToWine(r, mapping))

  function doImport() {
    const wines = dataRows.map(r => rowToWine(r, mapping)).filter(w => w.name)

    const withGrid = wines.filter(w => w.row > 0 && w.col > 0)
    const withoutGrid = wines.filter(w => !(w.row > 0 && w.col > 0))

    if (withGrid.length > 0) {
      const groups = {}
      withGrid.forEach(w => {
        const key = (w.rackLabel || 'Import-Regal').trim()
        if (!groups[key]) groups[key] = []
        groups[key].push(w)
      })

      Object.entries(groups).forEach(([label, items]) => {
        const maxRow = Math.max(...items.map(w => w.row))
        const maxCol = Math.max(...items.map(w => w.col))

        let rack = racks.find(r => r.label.toLowerCase().trim() === label.toLowerCase())
        let rackId
        if (rack) {
          rackId = rack.id
          if (!(rack.rows >= maxRow && rack.cols >= maxCol)) {
            setRackGrid(rackId, Math.max(rack.rows || 0, maxRow), Math.max(rack.cols || 0, maxCol))
          }
        } else {
          rackId = addRack(label, '🍷')
          setRackGrid(rackId, maxRow, maxCol)
        }

        items.forEach(w => {
          addBottle({ ...w, rackId, slot: '', row: w.row, col: w.col, count: w.count || 1 })
        })
      })
    }

    if (withoutGrid.length > 0) {
      addPendingBatch(withoutGrid)
    }

    onClose()
    if (withoutGrid.length > 0 && onImported) onImported(withoutGrid.length)
  }

  const sectionTitle = 'px-4 pb-1.5 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'
  const validCount = dataRows.filter(r => rowToWine(r, mapping).name).length

  return (
    <Sheet title="Excel-Import" onClose={onClose} z={60}
      confirmLabel={step !== 'pick' ? 'Importieren' : null} onConfirm={doImport} confirmDisabled={validCount === 0}>
      {step === 'pick' ? (
        <div className="flex flex-col items-center text-center px-8 py-10 gap-3">
          <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center"><Icon name="list" size={30} /></span>
          <h3 className="text-headline text-gray-900 dark:text-gray-100">.xlsx oder .csv hochladen</h3>
          <p className="text-callout text-gray-500 dark:text-gray-400 max-w-md">
            Egal wie deine Tabelle aufgebaut ist – die Spalten werden automatisch erkannt. Im nächsten Schritt kannst du jede Zuordnung prüfen.
          </p>
          <label className="btn-primary px-6 mt-2 cursor-pointer">
            Datei auswählen
            <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={handleFile} />
          </label>
          {error && <p className="text-callout text-expired dark:text-expired-dark">{error}</p>}
        </div>
      ) : (
        <div className="space-y-5">
          <FormSection>
            {wb?.SheetNames?.length > 1 && (
              <div>
                <label className="label" htmlFor="xl-sheet">Arbeitsblatt</label>
                <select id="xl-sheet" className="input" value={sheetName} onChange={e => changeSheet(e.target.value)}>
                  {wb.SheetNames.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            )}
            <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
              <input type="checkbox" className="w-5 h-5 accent-primary-500" checked={hasHeader} onChange={e => changeHasHeader(e.target.checked)} />
              <span className="flex-1 text-callout text-gray-800 dark:text-gray-100">Erste Zeile enthält Spaltennamen</span>
              <span className="text-footnote text-gray-500 dark:text-gray-400">{rawRows.length} Zeilen</span>
            </label>
          </FormSection>

          <section className="px-4">
            <h2 className={sectionTitle}>Spalten zuordnen</h2>
            <div className="bg-white dark:bg-gray-800 rounded-card overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
              {mapping.map((m, i) => (
                <div key={i} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-body font-semibold text-gray-900 dark:text-gray-100 truncate">{m.header || `Spalte ${i + 1}`}</span>
                    <select value={m.target} onChange={e => changeMappingTarget(i, e.target.value)} aria-label={`Zuordnung für ${m.header || `Spalte ${i + 1}`}`}
                      className="flex-none min-h-[40px] max-w-[55%] rounded-lg bg-gray-100 dark:bg-gray-700 text-callout text-primary-600 dark:text-primary-200 font-semibold px-2">
                      {TARGETS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  {m.samples.length > 0 && (
                    <p className="text-footnote text-gray-500 dark:text-gray-400 truncate mt-0.5">z. B. {m.samples.map(String).join(' · ')}</p>
                  )}
                </div>
              ))}
            </div>
            <p className="px-4 pt-1.5 text-footnote text-gray-500 dark:text-gray-400">Automatisch zugeordnet – bitte prüfen. Spalten ohne Zuordnung werden ignoriert.</p>
          </section>

          <ListGroup title="Vorschau (erste 5 Zeilen)">
            {preview.map((w, i) => (
              <ListRow key={i}
                title={w.name ? `${w.name}${w.vintage ? ` ${w.vintage}` : ''}` : <span className="text-expired dark:text-expired-dark">Kein Name – wird übersprungen</span>}
                subtitle={[w.winery, w.region, w.grape, w.color, w.alcoholFree && 'alkoholfrei', w.count > 1 && `${w.count}×`,
                  w.priceEur != null && `${w.priceEur} €`, w.row > 0 && w.col > 0 && `R${w.row}/P${w.col}`, w.rackLabel].filter(Boolean).join(' · ')} />
            ))}
          </ListGroup>

          <p className="px-8 text-footnote text-gray-500 dark:text-gray-400">
            {preview.some(w => w.row > 0 && w.col > 0)
              ? <>Reihen/Plätze erkannt – Regale werden automatisch mit Gitter angelegt und die Flaschen direkt einsortiert.{preview.some(w => !(w.row > 0 && w.col > 0)) && ' Flaschen ohne Position landen beim Einräumen.'}</>
              : 'Lagerorte weist du im nächsten Schritt zu – dort ordnest du jede Flasche einem Regal und Fach zu.'}
          </p>

          <div className="px-4">
            <button onClick={doImport} disabled={validCount === 0} className="btn-primary w-full">{validCount} {validCount === 1 ? 'Wein' : 'Weine'} importieren</button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
