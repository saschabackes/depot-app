import { useState, useEffect, useCallback } from 'react'
import { useCellar, CONDITION_OPTIONS } from './store'
import { shellyListDevices, shellyGetStatus } from '../../lib/shelly'
import { quality, RackGrid } from './cellarUi'
import { Chip } from './wineConstants'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow } from '../../ui/List'
import { Segmented, StatusPill } from '../../ui/Controls'
import { confirmAction } from '../../ui/feedback'

export const COND_KEYS = [
  { key: 'temperature', label: 'Temperatur' },
  { key: 'light',       label: 'Licht' },
  { key: 'humidity',    label: 'Feuchte' },
  { key: 'vibration',   label: 'Ruhe' },
]

export const EMOJI_OPTIONS = ['🍷','🛋️','🔻','🧊','🏠','🍾','🗄️','📦']

const GRID_PRESETS = [
  { label: '2 × 3', rows: 2, cols: 3 },
  { label: '3 × 4', rows: 3, cols: 4 },
  { label: '4 × 6', rows: 4, cols: 6 },
  { label: '5 × 8', rows: 5, cols: 8 },
  { label: '8 × 10', rows: 8, cols: 10 },
  { label: '25 × 5', rows: 25, cols: 5 },
]

const TYPE_OPTIONS = [
  { id: 'free',  label: 'Frei' },
  { id: 'slots', label: 'Fächer' },
  { id: 'grid',  label: 'Gitter' },
]
const TYPE_HINT = { free: 'Ohne feste Plätze', slots: 'Benannte Fächer, z. B. „oben“, „A/1“', grid: 'Reihen × Plätze – tippbarer Regalplan' }

function rackType(r) {
  if (r.rows > 0 && r.cols > 0) return 'grid'
  if (r.slots?.length > 0) return 'slots'
  return 'free'
}

const sectionTitle = 'px-4 pb-1.5 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'
const iconBtn = 'w-11 h-11 flex-none flex items-center justify-center rounded-full text-gray-400 disabled:opacity-25'

// Fächer: antippen = umbenennen, × = löschen, unten neues Fach
export function SlotEditor({ rack, addSlot, renameSlot, removeSlot }) {
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState('')
  const [newSlot, setNewSlot] = useState('')

  function commit() {
    const v = draft.trim()
    if (v && v !== editing) renameSlot(rack.id, editing, v)
    setEditing(null)
  }
  function add() {
    const v = (newSlot.trim() || String(rack.slots.length + 1))
    if (rack.slots.includes(v)) return
    addSlot(rack.id, v)
    setNewSlot('')
  }
  async function remove(s) {
    if (await confirmAction({ title: `Fach „${s}“ löschen?`, confirmLabel: 'Löschen', destructive: true })) removeSlot(rack.id, s)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {rack.slots.map(s => editing === s ? (
          <input key={s} autoFocus className="input !py-1.5 w-28" value={draft} aria-label={`Fach ${s} umbenennen`}
            onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit() } }} />
        ) : (
          <span key={s} className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            <button type="button" onClick={() => { setEditing(s); setDraft(s) }} aria-label={`Fach ${s} umbenennen`}
              className="min-h-[36px] pl-3 pr-1 text-[14px] font-semibold">{s}</button>
            <button type="button" onClick={() => remove(s)} aria-label={`Fach ${s} löschen`} className="w-9 h-9 flex items-center justify-center text-gray-400">
              <Icon name="close" size={14} strokeWidth={2.4} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="input flex-1" placeholder={`Neues Fach, z. B. ${rack.slots.length + 1}`} aria-label="Neues Fach"
          value={newSlot} onChange={e => setNewSlot(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" onClick={add} className="btn-secondary flex-none"><Icon name="plus" size={18} />Fach</button>
      </div>
    </div>
  )
}

export function ConditionPicker({ rack, setRackConditions }) {
  return (
    <div className="space-y-3">
      {COND_KEYS.map(({ key, label }) => (
        <div key={key}>
          <p className="text-footnote font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <div className="flex flex-wrap gap-1.5">
            {CONDITION_OPTIONS[key].map(opt => (
              <Chip key={opt.id} on={rack.conditions?.[key] === opt.id} onClick={() => setRackConditions(rack.id, { [key]: opt.id })}>{opt.label}</Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RackSettings({ onClose }) {
  const { racks, bottles, addRack, renameRack, removeRack, reorderRacks, addSlot, renameSlot, removeSlot, setRackConditions, setRackGrid, toggleBlockedCell, shellyConfig, setShellyConfig, setRackSensor, sensorReadings, updateSensorReading } = useCellar()
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState('🍷')
  const [newType, setNewType] = useState('free')
  const [showConditions, setShowConditions] = useState({})
  const [showShelly, setShowShelly] = useState(false)
  const [shellyAuth, setShellyAuth] = useState({ authKey: shellyConfig?.authKey || '', server: shellyConfig?.server || '' })
  const [shellyDevices, setShellyDevices] = useState(null)
  const [shellyLoading, setShellyLoading] = useState(false)
  const [shellyError, setShellyError] = useState('')

  const loadDevices = useCallback(async () => {
    if (!shellyConfig) return
    setShellyLoading(true)
    setShellyError('')
    try {
      const devices = await shellyListDevices(shellyConfig.authKey, shellyConfig.server)
      setShellyDevices(devices)
    } catch (e) {
      setShellyError(e.message)
    }
    setShellyLoading(false)
  }, [shellyConfig])

  useEffect(() => {
    if (shellyConfig && !shellyDevices) loadDevices()
  }, [shellyConfig, shellyDevices, loadDevices])

  useEffect(() => {
    if (!shellyConfig) return
    racks.filter(r => r.conditions?.shellyDeviceId).forEach(r => {
      const cached = sensorReadings[r.id]
      if (cached && Date.now() - cached.fetchedAt < 120_000) return
      shellyGetStatus(shellyConfig.authKey, shellyConfig.server, r.conditions.shellyDeviceId)
        .then(data => updateSensorReading(r.id, data))
        .catch(() => {})
    })
  }, [shellyConfig, racks, sensorReadings, updateSensorReading])

  function move(idx, dir) {
    const next = [...racks]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    reorderRacks(next)
  }

  function switchType(rack, type) {
    if (type === 'grid') {
      ;[...rack.slots].forEach(s => removeSlot(rack.id, s))
      if (!rack.rows || !rack.cols) setRackGrid(rack.id, 3, 4)
    } else if (type === 'slots') {
      setRackGrid(rack.id, 0, 0)
      if (!rack.slots?.length) {
        for (let i = 1; i <= 4; i++) addSlot(rack.id, String(i))
      }
    } else {
      setRackGrid(rack.id, 0, 0)
      ;[...rack.slots].forEach(s => removeSlot(rack.id, s))
    }
  }

  function createRack() {
    if (!newLabel.trim()) return
    const id = addRack(newLabel, newEmoji)
    const r = useCellar.getState().racks.find(r => r.id === id)
    if (r && newType === 'grid') {
      setRackGrid(id, 3, 4)
      ;[...r.slots].forEach(s => removeSlot(id, s))
    } else if (r && newType === 'free') {
      ;[...r.slots].forEach(s => removeSlot(id, s))
    }
    setNewLabel('')
  }

  async function deleteRack(r, count) {
    const ok = await confirmAction({
      title: `„${r.label}“ löschen?`,
      message: count ? `Die ${count} ${count === 1 ? 'Flasche' : 'Flaschen'} darin werden ebenfalls gelöscht.` : 'Das Lager ist leer.',
      confirmLabel: 'Lager löschen', destructive: true,
    })
    if (ok) removeRack(r.id)
  }

  async function connectShelly() {
    setShellyLoading(true)
    setShellyError('')
    try {
      const devices = await shellyListDevices(shellyAuth.authKey, shellyAuth.server)
      setShellyConfig(shellyAuth.authKey, shellyAuth.server)
      setShellyDevices(devices)
    } catch (e) {
      setShellyError(e.message)
    }
    setShellyLoading(false)
  }

  function onServerInput(raw) {
    setShellyAuth(p => ({ ...p, serverInput: raw }))
    const m = raw.match(/shelly-([a-z0-9-]+?)(?:-1)?\.shelly\.cloud/)
    if (m) {
      setShellyAuth(p => ({ ...p, serverInput: raw, server: m[1] }))
    } else {
      const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '')
      if (clean) setShellyAuth(p => ({ ...p, serverInput: raw, server: clean }))
    }
  }

  return (
    <Sheet title="Lager verwalten" onClose={onClose} cancelLabel="Schließen" confirmLabel="Fertig" onConfirm={onClose}>
      <div className="space-y-6">
        {racks.map((r, idx) => {
          const type = rackType(r)
          const q = quality(r.conditions)
          const condOpen = showConditions[r.id]
          const bottleCount = bottles.filter(b => b.rackId === r.id).reduce((s, b) => s + Math.max(0, b.count), 0)
          const reading = sensorReadings[r.id]
          const blockedCount = r.conditions?.blockedCells?.length || 0
          return (
            <section key={r.id} className="px-4">
              <div className="bg-white dark:bg-gray-800 rounded-card overflow-hidden">
                {/* Name, Emoji, Reihenfolge, Löschen */}
                <div className="flex items-center gap-1 pl-2 pr-1 py-1.5">
                  <select value={r.emoji} onChange={e => renameRack(r.id, r.label, e.target.value)} aria-label="Symbol"
                    className="bg-transparent text-[22px] w-11 h-11 text-center appearance-none">
                    {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
                  </select>
                  <input className="flex-1 min-w-0 bg-transparent text-body font-semibold text-gray-900 dark:text-gray-100 outline-none py-2"
                    aria-label="Name des Lagers" value={r.label} onChange={e => renameRack(r.id, e.target.value, r.emoji)} />
                  <span className="text-footnote text-gray-500 dark:text-gray-400 flex-none px-1">{bottleCount} Fl.</span>
                  {racks.length > 1 && (
                    <>
                      <button onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Nach oben verschieben" className={iconBtn}>
                        <Icon name="chevron" size={18} strokeWidth={2.2} className="-rotate-90" />
                      </button>
                      <button onClick={() => move(idx, 1)} disabled={idx === racks.length - 1} aria-label="Nach unten verschieben" className={iconBtn}>
                        <Icon name="chevron" size={18} strokeWidth={2.2} className="rotate-90" />
                      </button>
                    </>
                  )}
                  <button onClick={() => deleteRack(r, bottleCount)} aria-label={`${r.label} löschen`} className={`${iconBtn} text-expired dark:text-expired-dark`}>
                    <Icon name="trash" size={20} />
                  </button>
                </div>

                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="pt-3 space-y-1.5">
                    <Segmented label="Art der Plätze" value={type} onChange={t => switchType(r, t)} options={TYPE_OPTIONS} />
                    <p className="text-footnote text-gray-500 dark:text-gray-400 px-1">{TYPE_HINT[type]}</p>
                  </div>

                  {type === 'slots' && <SlotEditor rack={r} addSlot={addSlot} renameSlot={renameSlot} removeSlot={removeSlot} />}

                  {type === 'grid' && (
                    <div className="space-y-2.5">
                      <div className="flex gap-1.5 flex-wrap items-center">
                        {GRID_PRESETS.map(p => (
                          <Chip key={p.label} on={r.rows === p.rows && r.cols === p.cols} onClick={() => setRackGrid(r.id, p.rows, p.cols)}>{p.label}</Chip>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={`rows-${r.id}`}>Reihen</label>
                        <input id={`rows-${r.id}`} type="number" inputMode="numeric" min="1" max="50" className="input !w-20 text-center"
                          value={r.rows || ''} placeholder="Reihen"
                          onChange={e => setRackGrid(r.id, Math.max(1, Math.min(50, Number(e.target.value) || 1)), r.cols || 1)} />
                        <span className="text-gray-400">×</span>
                        <label className="sr-only" htmlFor={`cols-${r.id}`}>Plätze pro Reihe</label>
                        <input id={`cols-${r.id}`} type="number" inputMode="numeric" min="1" max="50" className="input !w-20 text-center"
                          value={r.cols || ''} placeholder="Plätze"
                          onChange={e => setRackGrid(r.id, r.rows || 1, Math.max(1, Math.min(50, Number(e.target.value) || 1)))} />
                        <span className="text-footnote text-gray-500 dark:text-gray-400">= {(r.rows || 0) * (r.cols || 0) - blockedCount} Plätze</span>
                      </div>
                      {r.rows > 0 && r.cols > 0 && (
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-2 space-y-1.5">
                          <RackGrid rack={r} bottles={bottles} mode="block" onCell={(r1, c1) => toggleBlockedCell(r.id, r1, c1)} />
                          <p className="text-footnote text-gray-500 dark:text-gray-400 text-center">
                            {blockedCount > 0 ? `${blockedCount} gesperrt – antippen zum Umschalten` : 'Platz antippen, um ihn zu sperren (z. B. bei versetzten Regalen)'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700">
                  <ListRow onClick={() => setShowConditions(p => ({ ...p, [r.id]: !p[r.id] }))}
                    title="Lagerbedingungen" subtitle="Beeinflussen das Trinkfenster der Flaschen"
                    trailing={<>
                      <StatusPill tone={q.tone}>{q.score}/100</StatusPill>
                      <Icon name="chevron" size={18} strokeWidth={2.2} className={`text-gray-400 transition-transform ${condOpen ? 'rotate-90' : ''}`} />
                    </>} />
                  {condOpen && <div className="px-4 pb-4"><ConditionPicker rack={r} setRackConditions={setRackConditions} /></div>}
                </div>

                {shellyConfig && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-2">
                    {r.conditions?.shellyDeviceId && reading && (
                      <p className="text-callout font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${reading.online ? 'bg-primary-500 dark:bg-primary-300' : 'bg-gray-300 dark:bg-gray-600'}`} aria-hidden="true" />
                        {[reading.temperature != null && `${reading.temperature.toFixed(1)} °C`, reading.humidity != null && `${reading.humidity.toFixed(0)} %`].filter(Boolean).join(' · ')}
                        {!reading.online && <span className="text-footnote font-normal text-gray-500">offline</span>}
                      </p>
                    )}
                    {shellyDevices && (
                      <>
                        <label className="label !mb-1" htmlFor={`sensor-${r.id}`}>Sensor</label>
                        <select id={`sensor-${r.id}`} value={r.conditions?.shellyDeviceId || ''} onChange={e => setRackSensor(r.id, e.target.value)} className="input">
                          <option value="">Kein Sensor</option>
                          {shellyDevices.filter(d => d.hasTemp || d.hasHum).map(d => (
                            <option key={d.id} value={d.id}>{d.name} {d.ip ? `(${d.ip})` : ''} {d.online ? '· online' : '· offline'}</option>
                          ))}
                          {shellyDevices.some(d => !d.hasTemp && !d.hasHum) && <option disabled>── Andere Geräte ──</option>}
                          {shellyDevices.filter(d => !d.hasTemp && !d.hasHum).map(d => (
                            <option key={d.id} value={d.id}>{d.name} {d.ip ? `(${d.ip})` : ''} {d.online ? '· online' : '· offline'}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>
          )
        })}

        {/* Neues Lager */}
        <section className="px-4">
          <h2 className={sectionTitle}>Neues Lager</h2>
          <div className="bg-white dark:bg-gray-800 rounded-card p-4 space-y-3">
            <Segmented label="Art der Plätze" value={newType} onChange={setNewType} options={TYPE_OPTIONS} />
            <div className="flex gap-2">
              <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)} aria-label="Symbol"
                className="bg-gray-100 dark:bg-gray-700 rounded-xl w-12 text-[20px] text-center appearance-none">
                {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
              </select>
              <input className="input flex-1 min-w-0" placeholder="z. B. Regal Garage" aria-label="Name des neuen Lagers" value={newLabel}
                onChange={e => setNewLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') createRack() }} />
            </div>
            <button onClick={createRack} disabled={!newLabel.trim()} className="btn-primary w-full"><Icon name="plus" size={20} />Lager anlegen</button>
          </div>
        </section>

        {/* Shelly-Sensoren */}
        <ListGroup title="Sensoren" footer={!shellyConfig && showShelly ? 'Shelly-App → Einstellungen → Cloud-Key: Auth-Key kopieren und Server-URL einfügen.' : null}>
          <ListRow onClick={() => setShowShelly(p => !p)} title="Shelly-Sensoren"
            subtitle={shellyConfig ? `Verbunden · Server ${shellyConfig.server}` : 'Temperatur & Feuchte live anzeigen'}
            trailing={<Icon name="chevron" size={18} strokeWidth={2.2} className={`text-gray-400 transition-transform ${showShelly ? 'rotate-90' : ''}`} />} />
          {showShelly && (
            <div className="px-4 py-3 space-y-3">
              {shellyConfig ? (
                <div className="flex gap-2">
                  <button onClick={loadDevices} disabled={shellyLoading} className="btn-secondary flex-1">{shellyLoading ? 'Lädt …' : 'Geräte aktualisieren'}</button>
                  <button onClick={async () => {
                    if (await confirmAction({ title: 'Shelly-Verbindung trennen?', message: 'Sensorwerte werden dann nicht mehr angezeigt.', confirmLabel: 'Trennen', destructive: true })) {
                      setShellyConfig(null, null); setShellyDevices(null)
                    }
                  }} className="min-h-[48px] px-4 text-callout font-semibold text-expired dark:text-expired-dark">Trennen</button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label" htmlFor="shelly-key">Auth-Key</label>
                    <input id="shelly-key" className="input" placeholder="MWVlNm…" autoComplete="off"
                      value={shellyAuth.authKey} onChange={e => setShellyAuth(p => ({ ...p, authKey: e.target.value.trim() }))} />
                  </div>
                  <div>
                    <label className="label" htmlFor="shelly-server">Server</label>
                    <input id="shelly-server" className="input" placeholder="https://shelly-84-eu.shelly.cloud oder 84-eu"
                      value={shellyAuth.serverInput || ''} onChange={e => onServerInput(e.target.value)} />
                    {shellyAuth.server && <p className="text-footnote text-primary-600 dark:text-primary-300 mt-1">Server-ID: {shellyAuth.server}</p>}
                  </div>
                  <button disabled={!shellyAuth.authKey || !shellyAuth.server || shellyLoading} onClick={connectShelly} className="btn-primary w-full">
                    {shellyLoading ? 'Verbinde …' : 'Verbinden'}
                  </button>
                </>
              )}
              {shellyError && <p className="text-footnote text-expired dark:text-expired-dark">{shellyError}</p>}
              {shellyDevices && !shellyDevices.length && (
                <p className="text-footnote text-gray-500 dark:text-gray-400">Keine Geräte gefunden. Prüfe, ob der Auth-Key stimmt.</p>
              )}
              {shellyDevices?.length > 0 && !shellyDevices.some(d => d.hasTemp || d.hasHum) && (
                <div className="space-y-1">
                  <p className="text-footnote text-soon dark:text-soon-dark">{shellyDevices.length} Gerät(e) gefunden, aber keines mit erkanntem Temperatur-/Feuchtesensor.</p>
                  {shellyDevices.map(d => (
                    <p key={d.id} className="text-footnote text-gray-500 dark:text-gray-400 break-all">
                      {d.name} ({d.model}, Gen{d.gen}): {d.statusKeys?.join(', ') || 'keine Status-Keys'}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </ListGroup>
      </div>
    </Sheet>
  )
}
