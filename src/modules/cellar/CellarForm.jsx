import { useState, useRef, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useCellar } from './store'
import { isSparkling, CountryPicker, ClassificationPicker, Chip, COLOR_EMOJI, COLOR_OPTIONS } from './wineConstants'
import { estimateDrinkWindow } from './drinkWindow'
import { FormSection, RackGrid } from './cellarUi'
import AutocompleteInput from '../../components/AutocompleteInput'
import BarcodeScanner from '../../components/BarcodeScanner'
import { localISODate } from '../../utils/date'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { Segmented } from '../../ui/Controls'
import { showToast } from '../../ui/feedback'

const WINE_TYPES = [
  { id: 'wein',      label: 'Wein' },
  { id: 'sekt',      label: 'Sekt' },
  { id: 'schorle',   label: 'Schorle' },
  { id: 'gluehwein', label: 'Glühwein' },
  { id: 'sonstige',  label: 'Sonstige' },
]

const SWEETNESS = [
  { id: 'trocken',     label: 'Trocken' },
  { id: 'halbtrocken', label: 'Halbtrocken' },
  { id: 'lieblich',    label: 'Lieblich' },
  { id: 'süß',         label: 'Süß' },
]

const SWEETNESS_SPARKLING = [
  { id: 'brut nature', label: 'Brut Nature' },
  { id: 'extra brut',  label: 'Extra Brut' },
  { id: 'brut',        label: 'Brut' },
  { id: 'extra dry',   label: 'Extra Dry' },
  { id: 'trocken',     label: 'Trocken' },
  { id: 'halbtrocken', label: 'Halbtrocken' },
  { id: 'süß',         label: 'Süß' },
]

export default function CellarForm({ prefilled, onClose }) {
  const { racks, bottles, addBottle, restockBottle, removePending, lastUsedRack } = useCellar()
  const winerySuggestions = useMemo(() => [...new Set(bottles.map(b => b.winery).filter(Boolean))].sort(), [bottles])
  const regionSuggestions = useMemo(() => [...new Set(bottles.map(b => b.region).filter(Boolean))].sort(), [bottles])
  const grapeSuggestions  = useMemo(() => [...new Set(bottles.map(b => b.grape).filter(Boolean))].sort(), [bottles])
  const pendingId = prefilled?.pendingId || null
  const fromBottleId = prefilled?.fromBottleId || null

  const [name, setName] = useState(prefilled?.name || '')
  const [winery, setWinery] = useState(prefilled?.winery || '')
  const [vintage, setVintage] = useState(prefilled?.vintage || new Date().getFullYear() - 2)
  const [region, setRegion] = useState(prefilled?.region || '')
  const [country, setCountry] = useState(prefilled?.country || '')
  const [grape, setGrape] = useState(prefilled?.grape || '')
  const [color, setColor] = useState(prefilled?.color || 'rot')
  const [wineType, setWineType] = useState(prefilled?.wineType || 'wein')
  const [sweetness, setSweetness] = useState(prefilled?.sweetness || '')
  const [classification, setClassification] = useState(prefilled?.classification || '')
  const [drinkFrom, setDrinkFrom] = useState(prefilled?.drinkFrom || '')
  const [drinkUntil, setDrinkUntil] = useState(prefilled?.drinkUntil || '')
  const [manualDrink, setManualDrink] = useState(!!(prefilled?.drinkFrom || prefilled?.drinkUntil))
  const [note, setNote] = useState('')
  const [photoData, setPhotoData] = useState(null)
  const [barcode, setBarcode] = useState('')
  const [barMsg, setBarMsg] = useState('')

  const [retailer, setRetailer] = useState('')
  const [priceEur, setPriceEur] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(localISODate())
  const [link, setLink] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  const startRackId = prefilled?.rackId || lastUsedRack?.rackId || racks[0]?.id
  const startSlot = prefilled?.slot || lastUsedRack?.slot || racks.find(r => r.id === startRackId)?.slots[0] || ''
  const [count, setCount] = useState(1)
  const startRack = racks.find(r => r.id === startRackId)
  const hasGrid = startRack?.rows > 0 && startRack?.cols > 0
  const [locations, setLocations] = useState([{ rackId: startRackId, slot: hasGrid ? '' : startSlot, row: prefilled?.row ?? null, col: prefilled?.col ?? null }])

  // Auto-Trinkfenster berechnen (ohne Lagerbedingungen — die fließen über effectiveDrinkUntil ein)
  useEffect(() => {
    if (manualDrink) return
    const v = Number(vintage)
    if (!v) return
    const est = estimateDrinkWindow(v, color, grape, classification, false)
    if (est) {
      setDrinkFrom(est.drinkFrom)
      setDrinkUntil(est.drinkUntil)
    }
  }, [vintage, color, grape, classification, manualDrink])

  const [bulkMode, setBulkMode] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeMsg, setAnalyzeMsg] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const photoRef = useRef(null)

  useEffect(() => {
    const n = Math.max(1, Number(count) || 1)
    setLocations(prev => {
      if (n === prev.length) return prev
      if (n > prev.length) {
        const last = prev[prev.length - 1] || { rackId: startRackId, slot: startSlot }
        return [...prev, ...Array(n - prev.length).fill(null).map(() => ({ ...last }))]
      }
      return prev.slice(0, n)
    })
  }, [count])

  function updateLocation(idx, field, value) {
    setLocations(prev => prev.map((loc, i) => {
      if (i !== idx) return loc
      if (field === 'rackId') {
        const rack = racks.find(r => r.id === value)
        const isGrid = rack?.rows > 0 && rack?.cols > 0
        return { rackId: value, slot: isGrid ? '' : (rack?.slots[0] || ''), row: null, col: null }
      }
      return { ...loc, [field]: value }
    }))
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]; if (!file) return
    const img = new Image(); const url = URL.createObjectURL(file)
    await new Promise(res => { img.onload = res; img.src = url })
    const canvas = document.createElement('canvas')
    const max = 800
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    canvas.width = img.width * scale; canvas.height = img.height * scale
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    setPhotoData(dataUrl)
    URL.revokeObjectURL(url)
    tryBarcodeFromImage(canvas)
    analyzeLabel(dataUrl)
  }

  async function analyzeLabel(imageDataUrl) {
    setAnalyzing(true)
    setAnalyzeMsg('Etikett wird analysiert …')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/.netlify/functions/analyze-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({ image: imageDataUrl }),
      })
      const json = await res.json()
      if (!json.ok) {
        setAnalyzeMsg(`Analyse fehlgeschlagen: ${json.error}`)
        return
      }
      const d = json.data
      if (d.name && !name)       setName(d.name)
      if (d.winery && !winery)   setWinery(d.winery)
      if (d.vintage)             setVintage(d.vintage)
      if (d.region && !region)   setRegion(d.region)
      if (d.country && !country) setCountry(d.country)
      if (d.grape && !grape)     setGrape(d.grape)
      if (d.color)               setColor(d.color)
      if (d.sweetness)           setSweetness(d.sweetness)
      if (d.wineType)            setWineType(d.wineType)
      if (d.classification)      setClassification(d.classification)
      const filled = [d.name, d.winery, d.region, d.grape].filter(Boolean)
      setAnalyzeMsg(`${filled.length} ${filled.length === 1 ? 'Feld' : 'Felder'} erkannt` + (d.classification ? ` · ${d.classification}` : ''))
    } catch {
      setAnalyzeMsg('Analyse nicht verfügbar (nur mit netlify dev)')
    } finally {
      setAnalyzing(false)
    }
  }

  async function tryBarcodeFromImage(canvas) {
    if (!('BarcodeDetector' in window)) return
    try {
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
      const results = await detector.detect(canvas)
      if (results.length > 0) {
        setBarcode(results[0].rawValue)
        setBarMsg(`Barcode erkannt: ${results[0].rawValue}`)
      }
    } catch { /* ignore */ }
  }

  function handleBarcodeDetected(code, productData) {
    setShowScanner(false)
    setBarcode(code)
    setBarMsg(`Barcode erkannt: ${code}`)
    if (productData?.name && !name) setName(productData.name)
  }

  function save() {
    if (!name.trim()) return
    if (fromBottleId) {
      restockBottle(fromBottleId, count)
    } else {
      addBottle({
        name, winery, vintage, region, country, grape, color, wineType, sweetness, classification,
        drinkFrom, drinkUntil, note, photoData, barcode,
        retailer, priceEur, purchaseDate, link,
        locations: locations.map(l => ({ rackId: l.rackId, slot: l.slot, row: l.row, col: l.col, count: 1 })),
      })
    }
    if (pendingId) removePending(pendingId)
    if (bulkMode) {
      showToast(`„${name}“ gespeichert – nächste Flasche?`, { duration: 2500 })
      setName(''); setWinery(''); setCountry(''); setClassification(''); setNote(''); setPhotoData(null); setBarcode('')
      setCount(1); setRetailer(''); setPriceEur(''); setLink(''); setBarMsg(''); setAnalyzeMsg('')
    } else onClose()
  }

  const title = pendingId ? 'Wein einräumen' : 'Neue Flasche'

  return (
    <>
      <Sheet title={title} onClose={onClose} confirmLabel="Sichern" onConfirm={save} confirmDisabled={!name.trim()}>
        <div className="space-y-5">
          {/* ── 1. Etikett & Barcode ─────────────────────────────────── */}
          <FormSection title="Etikett erfassen" footer="Fotografiere das Etikett – Name, Weingut, Jahrgang & Co. werden automatisch ausgefüllt.">
            <input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            <div className="flex gap-2">
              <button type="button" onClick={() => photoRef.current?.click()} className="btn-primary flex-1">
                <Icon name="camera" size={20} />Etikett fotografieren
              </button>
              <button type="button" onClick={() => setShowScanner(true)} className="btn-secondary flex-none" aria-label="Barcode scannen">
                <Icon name="scan" size={20} />Barcode
              </button>
            </div>

            {photoData && (
              <div className="relative">
                <img src={photoData} alt="Etikett" className="w-full max-h-40 rounded-xl object-cover" />
                <button type="button" onClick={() => { setPhotoData(null); setAnalyzeMsg('') }} aria-label="Foto entfernen"
                  className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"><Icon name="close" size={16} strokeWidth={2.4} /></span>
                </button>
              </div>
            )}

            {analyzing && (
              <div className="flex items-center gap-2 text-callout text-primary-600 dark:text-primary-300" role="status">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Etikett wird analysiert …
              </div>
            )}
            {analyzeMsg && !analyzing && <p className="text-callout text-primary-600 dark:text-primary-300" role="status">{analyzeMsg}</p>}
            {(barcode || barMsg) && (
              <p className="text-footnote text-gray-500 dark:text-gray-400">{barMsg || `EAN ${barcode}`}</p>
            )}
          </FormSection>

          {/* ── 2. Grunddaten ───────────────────────────────────────── */}
          <FormSection title="Grunddaten">
            <div>
              <label className="label" htmlFor="cf-name">Name</label>
              <input id="cf-name" className="input" placeholder="z. B. Gutedel Alte Reben, Grauer Burgunder …"
                value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="cf-winery">Weingut</label>
                <AutocompleteInput id="cf-winery" className="input" value={winery} onChange={setWinery} suggestions={winerySuggestions} />
              </div>
              <div>
                <label className="label" htmlFor="cf-vintage">Jahrgang</label>
                <input id="cf-vintage" type="number" inputMode="numeric" className="input" value={vintage} onChange={e => setVintage(e.target.value)} />
              </div>
            </div>
            <div>
              <span className="label">Land</span>
              <CountryPicker value={country} onChange={setCountry} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="cf-region">Region</label>
                <AutocompleteInput id="cf-region" className="input" value={region} onChange={setRegion} suggestions={regionSuggestions} />
              </div>
              <div>
                <label className="label" htmlFor="cf-grape">Rebsorte</label>
                <AutocompleteInput id="cf-grape" className="input" value={grape} onChange={setGrape} suggestions={grapeSuggestions} />
              </div>
            </div>
            <div>
              <span className="label">Farbe</span>
              <Segmented label="Farbe" value={color} onChange={setColor}
                options={COLOR_OPTIONS.map(c => ({ id: c.id, label: `${COLOR_EMOJI[c.id]} ${c.label}` }))} />
            </div>
            <div>
              <span className="label">Art</span>
              <div className="flex gap-1.5 flex-wrap">
                {WINE_TYPES.map(t => <Chip key={t.id} on={wineType === t.id} onClick={() => setWineType(t.id)}>{t.label}</Chip>)}
              </div>
            </div>
            <div>
              <span className="label">Geschmack</span>
              <div className="flex gap-1.5 flex-wrap">
                {(isSparkling(color, wineType) ? SWEETNESS_SPARKLING : SWEETNESS).map(s => (
                  <Chip key={s.id} on={sweetness === s.id} onClick={() => setSweetness(prev => prev === s.id ? '' : s.id)}>{s.label}</Chip>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Klassifikation</span>
              <ClassificationPicker value={classification} onChange={setClassification} />
            </div>
          </FormSection>

          {/* ── 3. Lagerort & Anzahl ────────────────────────────────── */}
          <FormSection title="Lagerort & Anzahl">
            <div className="flex items-center justify-between">
              <span className="text-body font-semibold text-gray-900 dark:text-gray-100">Anzahl Flaschen</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setCount(c => Math.max(1, c - 1))} disabled={count <= 1} aria-label="Eine Flasche weniger"
                  className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 text-primary-500 dark:text-primary-300 flex items-center justify-center disabled:opacity-40">
                  <Icon name="minus" size={20} strokeWidth={2.4} />
                </button>
                <span className="w-10 text-center text-[20px] font-semibold text-gray-900 dark:text-gray-100" aria-live="polite">{count}</span>
                <button type="button" onClick={() => setCount(c => c + 1)} aria-label="Eine Flasche mehr"
                  className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 text-primary-500 dark:text-primary-300 flex items-center justify-center">
                  <Icon name="plus" size={20} strokeWidth={2.4} />
                </button>
              </div>
            </div>

            {locations.map((loc, idx) => {
              const rack = racks.find(r => r.id === loc.rackId)
              const isGrid = rack?.rows > 0 && rack?.cols > 0
              return (
                <div key={idx} className={`space-y-2 ${count > 1 ? 'pt-3 border-t border-gray-100 dark:border-gray-700' : ''}`}>
                  {count > 1 && <p className="text-footnote font-semibold text-gray-500 dark:text-gray-400">Flasche {idx + 1}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {racks.map(r => (
                      <Chip key={r.id} on={loc.rackId === r.id} onClick={() => updateLocation(idx, 'rackId', r.id)}>{r.emoji} {r.label}</Chip>
                    ))}
                  </div>
                  {isGrid ? (
                    <div className="space-y-1.5">
                      <p className="text-footnote text-gray-500 dark:text-gray-400">
                        {loc.row && loc.col ? `Gewählt: Reihe ${loc.row}, Platz ${loc.col}` : 'Platz wählen'} · orange = belegt
                      </p>
                      <RackGrid rack={rack} bottles={bottles} mode="pick" selected={{ row: loc.row, col: loc.col }}
                        onCell={(r1, c1) => setLocations(prev => prev.map((l, i) => i === idx ? { ...l, row: r1, col: c1 } : l))} />
                    </div>
                  ) : rack && rack.slots.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rack.slots.map(s => <Chip key={s} on={loc.slot === s} onClick={() => updateLocation(idx, 'slot', s)}>{s}</Chip>)}
                    </div>
                  )}
                </div>
              )
            })}
          </FormSection>

          {/* ── 4. Trinkfenster ─────────────────────────────────────── */}
          <FormSection title="Trinkfenster"
            footer={!manualDrink && drinkFrom ? 'Geschätzt aus Farbe, Rebsorte & Klassifikation – Lagerbedingungen fließen separat ein.' : null}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="cf-from">Trinken ab</label>
                <input id="cf-from" type="number" inputMode="numeric" className="input" value={drinkFrom}
                  onChange={e => { setDrinkFrom(e.target.value); setManualDrink(true) }} />
              </div>
              <div>
                <label className="label" htmlFor="cf-until">Trinken bis</label>
                <input id="cf-until" type="number" inputMode="numeric" className="input" value={drinkUntil}
                  onChange={e => { setDrinkUntil(e.target.value); setManualDrink(true) }} />
              </div>
            </div>
            {manualDrink && (
              <button type="button" onClick={() => setManualDrink(false)}
                className="min-h-[44px] -my-2 text-callout font-semibold text-primary-500 dark:text-primary-300">Automatisch berechnen</button>
            )}
          </FormSection>

          {/* ── 5. Optionale Details ───────────────────────────────── */}
          <section className="px-4">
            <div className="bg-white dark:bg-gray-800 rounded-card overflow-hidden">
              <button type="button" onClick={() => setShowDetails(o => !o)} aria-expanded={showDetails}
                className="w-full flex items-center gap-3 px-4 min-h-[50px] text-left active:bg-gray-100 dark:active:bg-gray-700">
                <span className="flex-1 text-body font-semibold text-gray-900 dark:text-gray-100">Kauf & Notiz</span>
                <span className="text-footnote text-gray-500 dark:text-gray-400">optional</span>
                <Icon name="chevron" size={18} strokeWidth={2.2} className={`text-gray-400 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
              </button>
              {showDetails && (
                <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div>
                      <label className="label" htmlFor="cf-retailer">Händler</label>
                      <input id="cf-retailer" className="input" placeholder="z. B. Jacques’, REWE"
                        value={retailer} onChange={e => setRetailer(e.target.value)} />
                    </div>
                    <div>
                      <label className="label" htmlFor="cf-price">Preis (€)</label>
                      <input id="cf-price" type="number" step="0.01" inputMode="decimal" className="input" placeholder="0,00"
                        value={priceEur} onChange={e => setPriceEur(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label" htmlFor="cf-date">Kaufdatum</label>
                      <input id="cf-date" type="date" className="input" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="label" htmlFor="cf-link">Link zum Wein</label>
                      <input id="cf-link" type="url" className="input" placeholder="https://…" value={link} onChange={e => setLink(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="cf-note">Notiz</label>
                    <input id="cf-note" className="input" value={note} onChange={e => setNote(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Einlager-Modus ─────────────────────────────────────── */}
          <section className="px-4">
            <label className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-card px-4 py-3 min-h-[50px] cursor-pointer">
              <input type="checkbox" className="mt-0.5 w-5 h-5 accent-primary-500" checked={bulkMode} onChange={e => setBulkMode(e.target.checked)} />
              <span className="text-callout text-gray-700 dark:text-gray-200"><b>Einlager-Modus</b> – das Formular bleibt nach dem Sichern offen für die nächste Flasche</span>
            </label>
          </section>
        </div>
      </Sheet>
      {showScanner && <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />}
    </>
  )
}
