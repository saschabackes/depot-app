// Angebots-Merkliste mit Ein-Klick-Prüfung über Prospekt-Portale (marktguru, kaufDA)
import { useState, useMemo } from 'react'
import useStore from '../../store/useStore'
import { useDeals, activeOffer, isGoodDeal, searchTermOf, defaultSearchTerm, DEAL_SOURCES } from './dealsStore'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow, IconTile } from '../../ui/List'
import { confirmAction, showToast } from '../../ui/feedback'
import { localISODate } from '../../utils/date'

const STORES = ['ALDI SÜD', 'Lidl', 'REWE', 'EDEKA', 'PENNY', 'Netto', 'Kaufland', 'Globus', 'dm', 'Rossmann']

export const euro = v => v == null ? '' : `${Number(v).toFixed(2).replace('.', ',')} €`

function untilLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00')
  return 'bis ' + d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

function checkedLabel(ts) {
  if (!ts) return 'noch nie geprüft'
  const days = Math.round((Date.now() - new Date(ts).getTime()) / 86_400_000)
  return days <= 0 ? 'heute geprüft' : days === 1 ? 'gestern geprüft' : `vor ${days} Tagen geprüft`
}

// Prospekt-Angebote laufen meist bis Samstag
function nextSaturday() {
  const d = new Date()
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7))
  return localISODate(d)
}

export function offerSubtitle(w) {
  const o = activeOffer(w)
  if (o) return [euro(o.price), o.store && `bei ${o.store}`, untilLabel(o.until)].filter(Boolean).join(' · ')
  return [w.targetPrice != null && `Ziel ${euro(w.targetPrice)}`, checkedLabel(w.checkedAt)].filter(Boolean).join(' · ')
}

// ── Kachel im Einkauf-Tab ────────────────────────────────────────────────────
export function DealsSection() {
  const watches = useDeals(s => s.watches)
  const [open, setOpen] = useState(false)
  const good = watches.filter(isGoodDeal)

  return (
    <>
      <ListGroup title="Angebote" footer={watches.length ? null : 'Produkte merken, die ihr am liebsten im Angebot kauft – Depot hilft beim Prüfen.'}>
        {good.map(w => (
          <ListRow key={w.id} onClick={() => setOpen(true)}
            leading={<IconTile icon="tag" tone="accent" size={32} />}
            title={w.name} subtitle={offerSubtitle(w)} />
        ))}
        <ListRow onClick={() => setOpen(true)} chevron
          leading={good.length ? null : <IconTile icon="tag" tone="gray" size={32} />}
          title={watches.length ? 'Angebots-Merkliste' : 'Angebots-Merkliste anlegen'}
          subtitle={watches.length ? `${watches.length} ${watches.length === 1 ? 'Produkt' : 'Produkte'}${good.length ? '' : ' · gerade kein Angebot'}` : null} />
      </ListGroup>
      {open && <DealsSheet onClose={() => setOpen(false)} />}
    </>
  )
}

// ── Merkliste ────────────────────────────────────────────────────────────────
function DealsSheet({ onClose }) {
  const watches = useDeals(s => s.watches)
  const [editing, setEditing] = useState(null) // Eintrag oder 'new'
  const [checking, setChecking] = useState(null) // Liste der zu prüfenden IDs

  const sorted = useMemo(() => [...watches].sort((a, b) => Number(isGoodDeal(b)) - Number(isGoodDeal(a))), [watches])

  return (
    <Sheet title="Angebote" onClose={onClose} cancelLabel="Fertig">
      <div className="space-y-5">
        {watches.length > 0 && (
          <div className="px-4">
            <button onClick={() => setChecking(watches.map(w => w.id))}
              className="w-full min-h-[50px] rounded-card bg-primary-500 dark:bg-primary-400 text-white text-[17px] font-semibold flex items-center justify-center gap-2">
              <Icon name="search" size={20} strokeWidth={2.2} /> Alle {watches.length} prüfen
            </button>
            <p className="px-1 pt-2 text-footnote text-gray-500 dark:text-gray-400">
              Depot öffnet nacheinander die Angebotssuche bei marktguru. Du trägst ein, was du findest – oder tippst „Kein Angebot“.
            </p>
          </div>
        )}

        <ListGroup title={watches.length ? 'Merkliste' : null}
          footer={watches.length ? 'Antippen zum Bearbeiten oder einzeln prüfen.' : 'Noch leer. Lege Produkte an, die ihr regelmäßig im Angebot kauft, z. B. „Alpro No Milk“ mit Zielpreis.'}>
          {sorted.map(w => {
            const good = isGoodDeal(w)
            return (
              <ListRow key={w.id} onClick={() => setEditing(w)} chevron
                leading={<IconTile icon="tag" tone={good ? 'accent' : 'gray'} size={32} />}
                title={w.name}
                subtitle={<span className={good ? 'text-primary-600 dark:text-primary-300 font-semibold' : ''}>{offerSubtitle(w)}</span>} />
            )
          })}
          <ListRow onClick={() => setEditing('new')} tone="accent"
            leading={<Icon name="plus" size={20} strokeWidth={2.2} className="text-primary-500 dark:text-primary-300" />}
            title="Produkt hinzufügen" />
        </ListGroup>

        <p className="px-8 text-footnote text-gray-500 dark:text-gray-400 text-center">
          Tipp: Beim ersten Öffnen von marktguru bzw. kaufDA dort einmal euren Standort (PLZ) festlegen – die Seiten merken ihn sich.
        </p>
      </div>

      {editing && <WatchEditSheet watch={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
        onCheck={w => { setEditing(null); setChecking([w.id]) }} />}
      {checking && <CheckFlow ids={checking} onClose={() => setChecking(null)} />}
    </Sheet>
  )
}

// ── Anlegen / Bearbeiten ─────────────────────────────────────────────────────
function WatchEditSheet({ watch, onClose, onCheck }) {
  const addWatch = useDeals(s => s.addWatch)
  const updateWatch = useDeals(s => s.updateWatch)
  const removeWatch = useDeals(s => s.removeWatch)
  const addShoppingItem = useStore(s => s.addShoppingItem)
  const [name, setName] = useState(watch?.name || '')
  const [term, setTerm] = useState(watch?.searchTerm || '')
  const [target, setTarget] = useState(watch?.targetPrice != null ? String(watch.targetPrice).replace('.', ',') : '')

  const parsedTarget = target.trim() === '' ? null : Number(target.replace(',', '.'))
  const valid = name.trim() && (parsedTarget === null || (Number.isFinite(parsedTarget) && parsedTarget >= 0))
  const offer = watch && activeOffer(watch)

  function save() {
    if (!valid) return
    if (watch) updateWatch(watch.id, { name, searchTerm: term, targetPrice: parsedTarget })
    else addWatch({ name, searchTerm: term, targetPrice: parsedTarget })
    onClose()
  }

  async function remove() {
    if (!(await confirmAction({ title: `„${watch.name}“ von der Merkliste nehmen?`, confirmLabel: 'Entfernen', destructive: true }))) return
    removeWatch(watch.id); onClose()
  }

  function toShopping() {
    const amount = offer ? [euro(offer.price), offer.store].filter(Boolean).join(' bei ') : ''
    addShoppingItem(watch.name, amount)
    showToast(`„${watch.name}“ steht auf der Einkaufsliste.`, { duration: 2500 })
    onClose()
  }

  return (
    <Sheet title={watch ? 'Produkt' : 'Neues Produkt'} onClose={onClose} confirmLabel="Sichern" onConfirm={save} confirmDisabled={!valid} z={60}>
      <div className="px-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-card p-4 space-y-3">
          <div>
            <label className="label" htmlFor="pw-name">Produkt</label>
            <input id="pw-name" className="input" value={name} placeholder="z. B. Alpro No Milk" autoFocus={!watch}
              onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pw-term">Suchbegriff</label>
            <input id="pw-term" className="input" value={term} placeholder={name.trim() ? defaultSearchTerm(name) : 'z. B. alpro'}
              onChange={e => setTerm(e.target.value)} />
            <p className="text-footnote text-gray-500 dark:text-gray-400 mt-1">Kurz halten, meist reicht die Marke. Prospekte schreiben oft nur „Alpro Drink, versch. Sorten“.</p>
          </div>
          <div>
            <label className="label" htmlFor="pw-target">Zielpreis (optional)</label>
            <input id="pw-target" className="input" value={target} inputMode="decimal" placeholder="z. B. 1,99"
              onChange={e => setTarget(e.target.value)} />
            <p className="text-footnote text-gray-500 dark:text-gray-400 mt-1">Ab diesem Preis lohnt sich der Kauf – solche Angebote erscheinen oben im Einkauf.</p>
          </div>
        </div>

        {watch && (
          <ListGroup>
            <ListRow onClick={() => onCheck(watch)} tone="accent" title="Jetzt prüfen" />
            <ListRow onClick={toShopping} tone="accent" title="Auf die Einkaufsliste" subtitle={offer ? offerSubtitle(watch) : null} />
          </ListGroup>
        )}
        {watch?.bestPrice != null && (
          <p className="px-4 text-footnote text-gray-500 dark:text-gray-400">
            Bester bisher gefundener Preis: <span className="font-semibold">{euro(watch.bestPrice)}</span>{watch.bestStore && ` bei ${watch.bestStore}`}
          </p>
        )}
        {watch && (
          <div className="flex justify-center">
            <button onClick={remove} className="min-h-[44px] px-4 text-callout font-semibold text-expired dark:text-expired-dark">Von der Merkliste nehmen</button>
          </div>
        )}
      </div>
    </Sheet>
  )
}

// ── Prüf-Modus: ein Produkt nach dem anderen ─────────────────────────────────
function CheckFlow({ ids, onClose }) {
  const watches = useDeals(s => s.watches)
  const recordCheck = useDeals(s => s.recordCheck)
  const [index, setIndex] = useState(0)
  const [found, setFound] = useState(0)
  const w = watches.find(x => x.id === ids[index])

  function next(offer) {
    if (offer !== undefined) recordCheck(w.id, offer)
    if (offer) setFound(n => n + 1)
    if (index + 1 < ids.length) setIndex(index + 1)
    else {
      const total = found + (offer ? 1 : 0)
      showToast(total ? `${total} ${total === 1 ? 'Angebot' : 'Angebote'} gespeichert.` : 'Fertig – diesmal kein Angebot.', { duration: 3000 })
      onClose()
    }
  }

  if (!w) return null
  return (
    <Sheet title={ids.length > 1 ? `${index + 1} von ${ids.length}` : 'Prüfen'} onClose={onClose} cancelLabel="Beenden" z={70}>
      <CheckStep key={w.id} watch={w} onDone={next} isLast={index + 1 === ids.length} />
    </Sheet>
  )
}

function CheckStep({ watch, onDone, isLast }) {
  const q = searchTermOf(watch)
  const [price, setPrice] = useState('')
  const [store, setStore] = useState('')
  const [until, setUntil] = useState(nextSaturday())
  const parsed = Number(price.replace(',', '.'))
  const priceOk = price.trim() !== '' && Number.isFinite(parsed) && parsed >= 0
  const offer = activeOffer(watch)

  function openSource(src) {
    window.open(src.url(q), '_blank', 'noopener')
  }

  return (
    <div className="px-4 space-y-4">
      <div className="text-center pt-1">
        <h3 className="text-title font-bold text-gray-900 dark:text-gray-100">{watch.name}</h3>
        <p className="text-callout text-gray-500 dark:text-gray-400 mt-1">
          {[watch.targetPrice != null && `Zielpreis ${euro(watch.targetPrice)}`, offer && `zuletzt ${euro(offer.price)}${offer.store ? ` bei ${offer.store}` : ''}`].filter(Boolean).join(' · ') || `Suche nach „${q}“`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEAL_SOURCES.map((src, i) => (
          <button key={src.id} onClick={() => openSource(src)}
            className={`min-h-[50px] rounded-card text-callout font-semibold flex items-center justify-center gap-1.5 ${
              i === 0 ? 'bg-primary-500 dark:bg-primary-400 text-white' : 'bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-300'}`}>
            <Icon name="search" size={18} strokeWidth={2.2} /> {src.label}
          </button>
        ))}
      </div>
      <p className="text-footnote text-gray-500 dark:text-gray-400 text-center -mt-2">Sucht nach „{q}“ – danach hierher zurückkehren.</p>

      <div className={`bg-white dark:bg-gray-800 rounded-card p-4 space-y-3`}>
        <p className="text-headline text-gray-900 dark:text-gray-100">Angebot gefunden?</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="ck-price">Preis</label>
            <input id="ck-price" className="input" value={price} inputMode="decimal" placeholder="1,99" onChange={e => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="ck-until">Gültig bis</label>
            <input id="ck-until" type="date" className="input" value={until} onChange={e => setUntil(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="ck-store">Händler</label>
          <input id="ck-store" className="input" value={store} placeholder="z. B. PENNY" onChange={e => setStore(e.target.value)} />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {STORES.map(s => (
              <button key={s} type="button" onClick={() => setStore(s)} aria-pressed={store === s}
                className={`min-h-[32px] px-3 rounded-full text-footnote font-semibold ${store === s
                  ? 'bg-primary-500 text-white dark:bg-primary-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>{s}</button>
            ))}
          </div>
        </div>
        {priceOk && watch.targetPrice != null && (
          <p className={`text-footnote font-semibold ${parsed <= watch.targetPrice ? 'text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
            {parsed <= watch.targetPrice ? 'Unter dem Zielpreis – lohnt sich.' : `Über dem Zielpreis (${euro(watch.targetPrice)}).`}
          </p>
        )}
        <button disabled={!priceOk} onClick={() => onDone({ price: parsed, store, until })}
          className="w-full min-h-[48px] rounded-card bg-primary-500 dark:bg-primary-400 text-white text-callout font-semibold disabled:opacity-40">
          Angebot speichern{isLast ? '' : ' & weiter'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onDone(null)} className="min-h-[48px] rounded-card bg-white dark:bg-gray-800 text-callout font-semibold text-gray-700 dark:text-gray-200">
          Kein Angebot
        </button>
        <button onClick={() => onDone(undefined)} className="min-h-[48px] rounded-card bg-white dark:bg-gray-800 text-callout text-gray-500 dark:text-gray-400">
          Überspringen
        </button>
      </div>
    </div>
  )
}
