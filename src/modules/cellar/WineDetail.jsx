import { useState, useEffect } from 'react'
import { useCellar, effectiveDrinkUntil } from './store'
import { DISH_CATEGORIES, TASTE_AXES, AROMAS, dishById } from './pairing'
import { isSparkling, CountryPicker, ClassificationPicker, Chip, colorEmoji } from './wineConstants'
import { estimateDrinkWindow } from './drinkWindow'
import { windowInfo, quality, positionLabel, FactTile, FormSection, Stars, RackGrid } from './cellarUi'
import { isSafeUrl } from '../../utils/safeUrl'
import { localISODate } from '../../utils/date'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow } from '../../ui/List'
import { StatusPill } from '../../ui/Controls'
import { confirmAction, showToast } from '../../ui/feedback'

const COLOR_BG = { rot: 'from-rose-900 to-rose-700', weiß: 'from-yellow-700 to-yellow-500', rosé: 'from-pink-800 to-rose-600', schaum: 'from-amber-600 to-amber-400' }
const COLOR_NAME = { rot: 'Rotwein', weiß: 'Weißwein', rosé: 'Rosé', schaum: 'Schaumwein' }
const COUNTRY_FLAG = {
  'Deutschland':'🇩🇪','Italien':'🇮🇹','Frankreich':'🇫🇷','Spanien':'🇪🇸','Portugal':'🇵🇹',
  'Österreich':'🇦🇹','Schweiz':'🇨🇭','USA':'🇺🇸','Argentinien':'🇦🇷','Chile':'🇨🇱',
  'Südafrika':'🇿🇦','Neuseeland':'🇳🇿','Australien':'🇦🇺','Griechenland':'🇬🇷','Ungarn':'🇭🇺',
}
const fmtDate = d => { const x = new Date(d); return isNaN(x) ? d : x.toLocaleDateString('de-DE') }
const sectionTitle = 'px-4 pb-1.5 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'

export default function WineDetail({ bottle, onClose, onOpenPairing, onShare, onDuplicate }) {
  const racks = useCellar(s => s.racks)
  const drinkOne = useCellar(s => s.drinkOne)
  const removeBottle = useCellar(s => s.removeBottle)
  const updateBottle = useCellar(s => s.updateBottle)
  const toggleRestock = useCellar(s => s.toggleRestock)
  const [showDrink, setShowDrink] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  if (!bottle) return null
  const rack = racks.find(r => r.id === bottle.rackId)
  const effUntil = bottle.drinkUntil ? effectiveDrinkUntil(bottle, rack) : null
  const win = windowInfo(bottle, rack)
  const q = quality(rack?.conditions)
  const tp = bottle.tasteProfile || {}
  const drunken = bottle.history?.length || 0
  const flag = COUNTRY_FLAG[bottle.country] || ''
  const locationStr = [bottle.region, bottle.country].filter(Boolean).join(', ')
  const empty = bottle.count <= 0
  const pills = [bottle.vintage, COLOR_NAME[bottle.color] || bottle.color, bottle.sweetness,
    bottle.wineType && bottle.wineType !== 'wein' ? bottle.wineType : null, bottle.alcohol].filter(Boolean)

  const facts = [
    ['Trinkfenster', bottle.drinkFrom || effUntil ? `${bottle.drinkFrom || '?'}–${effUntil || '?'}` : '–',
      effUntil && effUntil !== bottle.drinkUntil ? `nominal bis ${bottle.drinkUntil}` : null],
    ['Lagerort', rack ? `${rack.emoji} ${rack.label}` : 'Ohne Lagerort', positionLabel(bottle) || null],
    ['Bestand', `${Math.max(0, bottle.count)} ${bottle.count === 1 ? 'Flasche' : 'Flaschen'}`, drunken ? `${drunken}× getrunken` : null],
    ['Rebsorte', bottle.grape || '–'],
    rack && ['Lagerqualität', `${q.score}/100`, q.label],
    bottle.classification && ['Klassifikation', bottle.classification],
    bottle.priceEur != null && ['Preis', Number(bottle.priceEur).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }), bottle.retailer || null],
    bottle.purchaseDate && ['Gekauft', fmtDate(bottle.purchaseDate), bottle.priceEur == null ? bottle.retailer || null : null],
  ].filter(Boolean)

  function duplicate() {
    onDuplicate({
      name: bottle.name, winery: bottle.winery, vintage: bottle.vintage,
      region: bottle.region, country: bottle.country, grape: bottle.grape,
      color: bottle.color, wineType: bottle.wineType, sweetness: bottle.sweetness,
      classification: bottle.classification, alcohol: bottle.alcohol,
      alcoholFree: bottle.alcoholFree, drinkFrom: bottle.drinkFrom, drinkUntil: bottle.drinkUntil,
      priceEur: bottle.priceEur, retailer: bottle.retailer, rackId: bottle.rackId,
    })
  }

  function restock() {
    const willAdd = !bottle.restock
    toggleRestock(bottle.id)
    showToast(willAdd ? `„${bottle.name}“ steht auf der Einkaufsliste.` : `„${bottle.name}“ von der Einkaufsliste genommen.`)
  }

  async function remove() {
    const ok = await confirmAction({ title: `„${bottle.name}“ löschen?`, message: 'Der Wein verschwindet samt Trink-Historie. Zum Ausblenden lieber archivieren.', confirmLabel: 'Löschen', destructive: true })
    if (ok) { removeBottle(bottle.id); onClose() }
  }

  return (
    <>
      <Sheet title={bottle.name} onClose={onClose} cancelLabel="Schließen" confirmLabel="Bearbeiten" onConfirm={() => setShowEdit(true)}>
        <div className="space-y-5">
          {/* Hero in der Farbe des Weins */}
          <div className="px-4">
            <div className={`rounded-card bg-gradient-to-br ${COLOR_BG[bottle.color] || COLOR_BG.rot} text-white p-4 flex gap-4`}>
              {bottle.photoData
                ? <img src={bottle.photoData} alt="" className="w-[76px] h-[104px] rounded-xl object-cover ring-1 ring-white/25 flex-none" />
                : <div className="w-[76px] h-[104px] rounded-xl bg-white/15 flex items-center justify-center text-[44px] flex-none" aria-hidden="true">{colorEmoji(bottle.color)}</div>}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {bottle.winery && <p className="text-footnote font-semibold uppercase tracking-wide text-white/80 truncate">{bottle.winery}</p>}
                <h3 className="text-[22px] leading-[27px] font-bold line-clamp-3">{bottle.name}</h3>
                {locationStr && <p className="text-footnote text-white/80 truncate mt-0.5">{flag} {locationStr}</p>}
                {pills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pills.map(p => <span key={p} className="bg-white/20 text-footnote font-semibold px-2 py-0.5 rounded-full">{p}</span>)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {(win.long || bottle.alcoholFree || bottle.archived) && (
            <div className="px-5 flex flex-wrap gap-1.5 -mt-1">
              {win.long && <StatusPill tone={win.tone || (win.young ? 'neutral' : 'accent')}>{win.long}</StatusPill>}
              {bottle.alcoholFree && <StatusPill tone="neutral">Alkoholfrei</StatusPill>}
              {bottle.archived && <StatusPill tone="neutral">Archiviert</StatusPill>}
            </div>
          )}

          <div className="px-4 grid grid-cols-2 gap-2.5">
            {facts.map(([k, v, sub]) => <FactTile key={k} label={k} value={v} sub={sub} />)}
          </div>

          {/* Primäre Aktion */}
          <div className="px-4 space-y-2">
            {!empty ? (
              <button onClick={() => setShowDrink(true)} className="btn-primary w-full"><Icon name="wine" size={20} />Flasche trinken</button>
            ) : (
              <>
                <p className="px-1 text-callout text-gray-600 dark:text-gray-300">
                  Ausgetrunken – war {bottle.rating > 0 ? `mit ${bottle.rating} ${bottle.rating === 1 ? 'Stern' : 'Sternen'} ` : ''}in deiner Sammlung.
                </p>
                <button onClick={restock} className={bottle.restock ? 'btn-secondary w-full' : 'btn-primary w-full'}>
                  <Icon name={bottle.restock ? 'check' : 'cart'} size={20} />{bottle.restock ? 'Steht auf der Einkaufsliste' : 'Wieder kaufen'}
                </button>
              </>
            )}
          </div>

          <ListGroup>
            {onDuplicate && <ListRow onClick={duplicate} leading={<Icon name="plus" size={20} className="text-primary-500 dark:text-primary-300" />} title="Weitere Flasche anlegen" chevron />}
            {onShare && <ListRow onClick={() => onShare(bottle.id)} leading={<Icon name="share" size={20} className="text-primary-500 dark:text-primary-300" />} title="Weiterempfehlen" chevron />}
            {!empty && (
              <ListRow onClick={restock} leading={<Icon name="cart" size={20} className="text-primary-500 dark:text-primary-300" />} title="Nachkaufen"
                trailing={bottle.restock ? <span className="text-footnote font-semibold text-primary-500 dark:text-primary-300 flex items-center gap-1"><Icon name="check" size={16} strokeWidth={2.6} />Auf der Liste</span> : null} />
            )}
            {isSafeUrl(bottle.link) && (
              <a href={bottle.link} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[50px] active:bg-gray-100 dark:active:bg-gray-700">
                <Icon name="share" size={20} className="text-primary-500 dark:text-primary-300 rotate-45" />
                <span className="flex-1 min-w-0">
                  <span className="block text-body font-semibold text-gray-900 dark:text-gray-100">Zum Wein im Web</span>
                  <span className="block text-footnote text-gray-500 dark:text-gray-400 truncate">{bottle.link}</span>
                </span>
                <Icon name="chevron" size={18} strokeWidth={2.2} className="text-gray-300 dark:text-gray-600" />
              </a>
            )}
            <ListRow onClick={() => { updateBottle(bottle.id, { archived: !bottle.archived }); showToast(bottle.archived ? 'Wein wiederhergestellt.' : 'Wein archiviert – im Tagebuch unter „Archiv“.') }}
              leading={<Icon name="boxes" size={20} className="text-gray-500 dark:text-gray-400" />}
              title={bottle.archived ? 'Aus dem Archiv holen' : 'Archivieren'}
              subtitle={bottle.archived ? null : 'Im Weintagebuch ausblenden'} />
          </ListGroup>

          {/* Bewertung */}
          <ListGroup title="Deine Bewertung">
            <div className="px-2 py-1 flex justify-center">
              <Stars value={bottle.rating || 0} onChange={r => updateBottle(bottle.id, { rating: r })} size={26} />
            </div>
          </ListGroup>

          {/* Geschmacksprofil */}
          <section className="px-4">
            <h2 className={sectionTitle}>Geschmacksprofil</h2>
            <div className="bg-white dark:bg-gray-800 rounded-card px-4 py-3 space-y-3">
              {TASTE_AXES
                .filter(ax => bottle.color !== 'weiß' || ax.key !== 'tannin') // Tannin nur bei Rot relevant
                .map(ax => (
                  <AxisRow key={ax.key} axis={ax} value={tp[ax.key]} onChange={v => updateBottle(bottle.id, { tasteProfile: { ...tp, [ax.key]: v } })} />
                ))}
            </div>
          </section>

          {/* Aromen & Pairings */}
          <section className="px-4">
            <h2 className={sectionTitle}>Aromen</h2>
            <div className="bg-white dark:bg-gray-800 rounded-card p-3">
              {bottle.aromas?.length > 0
                ? <div className="flex flex-wrap gap-1.5">{bottle.aromas.map(a => <span key={a} className="text-footnote font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">{a}</span>)}</div>
                : <p className="text-callout text-gray-500 dark:text-gray-400 px-1">Noch keine Aromen – über „Bearbeiten“ ergänzen.</p>}
            </div>
          </section>

          <section className="px-4">
            <h2 className={sectionTitle}>Passt zu</h2>
            <div className="bg-white dark:bg-gray-800 rounded-card p-3">
              {bottle.pairings?.length > 0
                ? <div className="flex flex-wrap gap-1.5">
                    {bottle.pairings.map(id => {
                      const d = dishById(id); if (!d) return null
                      return <span key={id} className="text-footnote font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-200">{d.emoji} {d.label}</span>
                    })}
                  </div>
                : <p className="text-callout text-gray-500 dark:text-gray-400 px-1">Keine Speisen hinterlegt – über „Bearbeiten“ ergänzen.</p>}
            </div>
          </section>

          {/* Notizen */}
          <section className="px-4">
            <h2 className={sectionTitle}>Tasting-Notizen</h2>
            <textarea
              className="input resize-none border-0"
              rows={3}
              aria-label="Tasting-Notizen"
              placeholder="Wie war der Wein? Eindrücke, Tipps für nächstes Mal …"
              value={bottle.tastingNotes || ''}
              onChange={e => updateBottle(bottle.id, { tastingNotes: e.target.value })}
            />
          </section>

          {/* Historie */}
          {drunken > 0 && (
            <ListGroup title={`Getrunken (${drunken})`}>
              {[...bottle.history].reverse().map(h => (
                <ListRow key={h.id} title={fmtDate(h.date)}
                  subtitle={[h.occasion, h.note].filter(Boolean).join(' · ') || null}
                  trailing={h.rating ? <Stars value={h.rating} size={13} /> : null} />
              ))}
            </ListGroup>
          )}

          <div className="flex justify-center">
            <button onClick={remove} className="min-h-[44px] px-4 text-callout font-semibold text-expired dark:text-expired-dark">Eintrag löschen</button>
          </div>
        </div>
      </Sheet>

      {showDrink && (
        <DrinkSheet bottle={bottle} onClose={() => setShowDrink(false)}
          onSave={entry => { drinkOne(bottle.id, entry); setShowDrink(false); showToast(`Zum Wohl! Noch ${Math.max(0, bottle.count - 1)}× „${bottle.name}“ im Bestand.`) }} />
      )}
      {showEdit && (
        <EditSheet bottle={bottle} onClose={() => setShowEdit(false)} onSave={patch => { updateBottle(bottle.id, patch); setShowEdit(false) }} />
      )}
    </>
  )
}

// ── Geschmacksachse (tippbare Stufen) ───────────────────────────────────────
function AxisRow({ axis, value, onChange }) {
  const idx = axis.steps.indexOf(value)
  return (
    <div>
      <div className="flex justify-between text-footnote">
        <span className="text-gray-500 dark:text-gray-400">{axis.label}</span>
        <span className="font-semibold text-gray-900 dark:text-gray-100">{value || '–'}</span>
      </div>
      <div className="flex gap-1" role="group" aria-label={axis.label}>
        {axis.steps.map((s, i) => (
          <button key={s} type="button" onClick={() => onChange(s === value ? null : s)} aria-label={s} aria-pressed={s === value}
            className="flex-1 h-9 flex items-center">
            <span className={`w-full h-2 rounded-full transition-colors ${i <= idx && idx >= 0 ? 'bg-primary-500 dark:bg-primary-300' : 'bg-gray-200 dark:bg-gray-700'}`} />
          </button>
        ))}
      </div>
      <div className="flex justify-between text-footnote text-gray-500 dark:text-gray-400 -mt-1">
        <span>{axis.left}</span><span>{axis.right}</span>
      </div>
    </div>
  )
}

// ── Trinken-Sheet ────────────────────────────────────────────────────────────
function DrinkSheet({ bottle, onClose, onSave }) {
  const [rating, setRating]     = useState(bottle.rating || 0)
  const [occasion, setOccasion] = useState('')
  const [note, setNote]         = useState('')
  const [date, setDate]         = useState(localISODate())
  return (
    <Sheet title="Flasche trinken" onClose={onClose} confirmLabel="Eintragen" z={60}
      onConfirm={() => onSave({ rating: rating || undefined, occasion, note, date })}>
      <div className="space-y-5">
        <p className="px-8 text-callout text-center text-gray-500 dark:text-gray-400">
          {bottle.name}{bottle.vintage ? ` ${bottle.vintage}` : ''} – danach {Math.max(0, bottle.count - 1)}× im Bestand
        </p>
        <FormSection>
          <div>
            <label className="label" htmlFor="drink-date">Wann</label>
            <input id="drink-date" type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <span className="label">Bewertung</span>
            <div className="-mx-2"><Stars value={rating} onChange={setRating} size={28} /></div>
          </div>
          <div>
            <label className="label" htmlFor="drink-occasion">Anlass</label>
            <input id="drink-occasion" className="input" placeholder="z. B. Geburtstag Anna, Sonntagsbraten"
              value={occasion} onChange={e => setOccasion(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="drink-note">Notiz</label>
            <textarea id="drink-note" className="input resize-none" rows={2}
              placeholder="Wie war’s? Pairing? Erinnerung …"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </FormSection>
      </div>
    </Sheet>
  )
}

// ── Bearbeiten: Stammdaten, Lagerplatz, Aromen, Pairings ─────────────────────
function EditSheet({ bottle, onClose, onSave }) {
  const racks = useCellar(s => s.racks)
  const bottles = useCellar(s => s.bottles)
  const [name, setName]       = useState(bottle.name)
  const [winery, setWinery]   = useState(bottle.winery || '')
  const [region, setRegion]   = useState(bottle.region || '')
  const [country, setCountry] = useState(bottle.country || '')
  const [grape, setGrape]     = useState(bottle.grape || '')
  const [alcohol, setAlcohol] = useState(bottle.alcohol || '')
  const [sweetness, setSweetness] = useState(bottle.sweetness || '')
  const [classification, setClassification] = useState(bottle.classification || '')
  const [wineType, setWineType]   = useState(bottle.wineType || 'wein')
  const [retailer, setRetailer]   = useState(bottle.retailer || '')
  const [priceEur, setPriceEur]   = useState(bottle.priceEur ?? '')
  const [purchaseDate, setPurchaseDate] = useState(bottle.purchaseDate || '')
  const [link, setLink]           = useState(bottle.link || '')
  const [aromas, setAromas]   = useState(bottle.aromas || [])
  const [pairings, setPairings] = useState(bottle.pairings || [])
  const [alcoholFree, setAlcoholFree] = useState(!!bottle.alcoholFree)
  const [drinkFrom, setDrinkFrom] = useState(bottle.drinkFrom || '')
  const [drinkUntil, setDrinkUntil] = useState(bottle.drinkUntil || '')
  const [manualDrink, setManualDrink] = useState(true)
  const [rackId, setRackId] = useState(bottle.rackId || racks[0]?.id)
  const [slot, setSlot]     = useState(bottle.slot || '')
  const [gridRow, setGridRow] = useState(bottle.row ?? null)
  const [gridCol, setGridCol] = useState(bottle.col ?? null)
  const selectedRack = racks.find(r => r.id === rackId)
  const isGrid = selectedRack?.rows > 0 && selectedRack?.cols > 0

  useEffect(() => {
    if (manualDrink) return
    const v = bottle.vintage
    if (!v) return
    const est = estimateDrinkWindow(v, bottle.color, grape, classification, alcoholFree)
    if (est) { setDrinkFrom(est.drinkFrom); setDrinkUntil(est.drinkUntil) }
  }, [grape, classification, alcoholFree, manualDrink, bottle.vintage, bottle.color])

  function toggle(arr, set, v) { set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]) }

  function save() {
    onSave({
      name, winery, region, country, grape, alcohol, alcoholFree, sweetness, classification, wineType, retailer,
      priceEur: priceEur ? Number(priceEur) : null, purchaseDate, link, aromas, pairings,
      drinkFrom: drinkFrom ? Number(drinkFrom) : null, drinkUntil: drinkUntil ? Number(drinkUntil) : null,
      rackId, slot: isGrid ? '' : slot, row: isGrid ? gridRow : null, col: isGrid ? gridCol : null,
    })
  }

  return (
    <Sheet title="Wein bearbeiten" onClose={onClose} confirmLabel="Sichern" onConfirm={save} confirmDisabled={!name.trim()} z={60}>
      <div className="space-y-5">
        <FormSection title="Grunddaten">
          <div><label className="label" htmlFor="ed-name">Name</label><input id="ed-name" className="input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="ed-winery">Weingut</label><input id="ed-winery" className="input" value={winery} onChange={e => setWinery(e.target.value)} /></div>
            <div><label className="label" htmlFor="ed-region">Region</label><input id="ed-region" className="input" value={region} onChange={e => setRegion(e.target.value)} /></div>
            <div><label className="label" htmlFor="ed-grape">Rebsorte</label><input id="ed-grape" className="input" value={grape} onChange={e => setGrape(e.target.value)} /></div>
            <div><label className="label" htmlFor="ed-alc">Alkohol</label><input id="ed-alc" className="input" value={alcohol} onChange={e => setAlcohol(e.target.value)} placeholder="13,5 %" /></div>
          </div>
          <div><span className="label">Land</span><CountryPicker value={country} onChange={setCountry} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ed-sweet">Geschmack</label>
              <select id="ed-sweet" className="input" value={sweetness} onChange={e => setSweetness(e.target.value)}>
                <option value="">–</option>
                {isSparkling(bottle.color, wineType) && <>
                  <option value="brut nature">Brut Nature</option>
                  <option value="extra brut">Extra Brut</option>
                  <option value="brut">Brut</option>
                  <option value="extra dry">Extra Dry</option>
                </>}
                <option value="trocken">Trocken</option>
                <option value="halbtrocken">Halbtrocken</option>
                <option value="lieblich">Lieblich</option>
                <option value="süß">Süß</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ed-type">Art</label>
              <select id="ed-type" className="input" value={wineType} onChange={e => setWineType(e.target.value)}>
                <option value="wein">Wein</option>
                <option value="sekt">Sekt</option>
                <option value="schorle">Schorle</option>
                <option value="gluehwein">Glühwein</option>
                <option value="sonstige">Sonstige</option>
              </select>
            </div>
          </div>
          <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
            <input type="checkbox" className="mt-1 w-5 h-5 accent-primary-500" checked={alcoholFree} onChange={e => setAlcoholFree(e.target.checked)} />
            <span className="text-callout text-gray-700 dark:text-gray-200"><b>Alkoholfrei</b> – ohne Promille, passt für Schwangerschaft, Autofahrer, abends auf der Couch</span>
          </label>
        </FormSection>

        <FormSection title="Qualität / Klassifikation">
          <ClassificationPicker value={classification} onChange={setClassification} />
        </FormSection>

        <FormSection title="Lagerplatz">
          <div className="flex flex-wrap gap-1.5">
            {racks.map(r => (
              <Chip key={r.id} on={rackId === r.id}
                onClick={() => { setRackId(r.id); setSlot(r.slots?.[0] || ''); setGridRow(null); setGridCol(null) }}>{r.emoji} {r.label}</Chip>
            ))}
          </div>
          {isGrid ? (
            <div className="space-y-1.5">
              <p className="text-footnote text-gray-500 dark:text-gray-400">
                {gridRow && gridCol ? `Gewählt: Reihe ${gridRow}, Platz ${gridCol}` : 'Platz wählen'} · orange = belegt
              </p>
              <RackGrid rack={selectedRack} bottles={bottles} mode="pick" selected={{ row: gridRow, col: gridCol }}
                onCell={(r, c) => { setGridRow(r); setGridCol(c) }} />
            </div>
          ) : selectedRack?.slots?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedRack.slots.map(s => <Chip key={s} on={slot === s} onClick={() => setSlot(s)}>{s}</Chip>)}
            </div>
          ) : (
            <input className="input" placeholder="Fach / Platz" aria-label="Fach / Platz" value={slot} onChange={e => setSlot(e.target.value)} />
          )}
        </FormSection>

        <FormSection title="Trinkfenster" footer={!manualDrink && drinkFrom ? 'Automatisch geschätzt aus Rebsorte & Klassifikation.' : null}>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="ed-from">Trinken ab</label><input id="ed-from" type="number" inputMode="numeric" className="input" value={drinkFrom}
              onChange={e => { setDrinkFrom(e.target.value); setManualDrink(true) }} /></div>
            <div><label className="label" htmlFor="ed-until">Trinken bis</label><input id="ed-until" type="number" inputMode="numeric" className="input" value={drinkUntil}
              onChange={e => { setDrinkUntil(e.target.value); setManualDrink(true) }} /></div>
          </div>
          {manualDrink && (
            <button type="button" onClick={() => setManualDrink(false)}
              className="min-h-[44px] -my-2 text-callout font-semibold text-primary-500 dark:text-primary-300">Automatisch berechnen</button>
          )}
        </FormSection>

        <FormSection title="Kauf">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="ed-price">Preis (€)</label><input id="ed-price" type="number" step="0.01" inputMode="decimal" className="input" value={priceEur} onChange={e => setPriceEur(e.target.value)} /></div>
            <div><label className="label" htmlFor="ed-date">Kaufdatum</label><input id="ed-date" type="date" className="input" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} /></div>
          </div>
          <div><label className="label" htmlFor="ed-retailer">Händler</label><input id="ed-retailer" className="input" value={retailer} onChange={e => setRetailer(e.target.value)} placeholder="z. B. Jacques’" /></div>
          <div><label className="label" htmlFor="ed-link">Link</label><input id="ed-link" type="url" className="input" value={link} onChange={e => setLink(e.target.value)} placeholder="https://…" /></div>
        </FormSection>

        <FormSection title="Aromen">
          <div className="flex flex-wrap gap-1.5">
            {AROMAS.map(a => <Chip key={a} on={aromas.includes(a)} onClick={() => toggle(aromas, setAromas, a)}>{a}</Chip>)}
          </div>
        </FormSection>

        <FormSection title="Passt zu">
          <div className="flex flex-wrap gap-1.5">
            {DISH_CATEGORIES.map(d => <Chip key={d.id} on={pairings.includes(d.id)} onClick={() => toggle(pairings, setPairings, d.id)}>{d.emoji} {d.label}</Chip>)}
          </div>
        </FormSection>
      </div>
    </Sheet>
  )
}
