import { useState, useEffect, useCallback } from 'react'
import { useCellar, CONDITION_OPTIONS, qualityScore, qualityLabel } from './store'
import { shellyListDevices, shellyGetStatus } from '../../lib/shelly'

const COND_KEYS = [
  { key: 'temperature', label: '🌡️ Temperatur' },
  { key: 'light',       label: '💡 Licht' },
  { key: 'humidity',    label: '💧 Feuchte' },
  { key: 'vibration',   label: '🔇 Ruhe' },
]

const EMOJI_OPTIONS = ['🍷','🛋️','🔻','🧊','🏠','🍾','🗄️','📦']

const GRID_PRESETS = [
  { label: '2 × 3', rows: 2, cols: 3 },
  { label: '3 × 4', rows: 3, cols: 4 },
  { label: '4 × 6', rows: 4, cols: 6 },
  { label: '5 × 8', rows: 5, cols: 8 },
]

function rackType(r) {
  if (r.rows > 0 && r.cols > 0) return 'grid'
  if (r.slots?.length > 0) return 'slots'
  return 'free'
}

export default function RackSettings({ onClose }) {
  const { racks, bottles, addRack, renameRack, removeRack, reorderRacks, addSlot, renameSlot, removeSlot, setRackConditions, setRackGrid, shellyConfig, setShellyConfig, setRackSensor, sensorReadings, updateSensorReading } = useCellar()
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
    const sensorRacks = racks.filter(r => r.conditions?.shellyDeviceId)
    sensorRacks.forEach(r => {
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
      while (rack.slots.length > 0) removeSlot(rack.id, rack.slots[0])
      if (!rack.rows || !rack.cols) setRackGrid(rack.id, 3, 4)
    } else if (type === 'slots') {
      setRackGrid(rack.id, 0, 0)
      if (!rack.slots?.length) {
        for (let i = 1; i <= 4; i++) addSlot(rack.id, String(i))
      }
    } else {
      setRackGrid(rack.id, 0, 0)
      while (rack.slots.length > 0) removeSlot(rack.id, rack.slots[0])
    }
  }

  function createRack() {
    if (!newLabel.trim()) return
    const id = addRack(newLabel, newEmoji)
    const r = useCellar.getState().racks.find(r => r.id === id)
    if (r && newType === 'grid') {
      setRackGrid(id, 3, 4)
      while (r.slots.length > 0) removeSlot(id, r.slots[0])
    } else if (r && newType === 'free') {
      while (r.slots.length > 0) removeSlot(id, r.slots[0])
    }
    setNewLabel('')
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 fade-enter" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl sheet-enter max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 flex-none">
          <div className="w-10 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 flex-none border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">🍷 Weinlager verwalten</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {racks.map((r, idx) => {
            const type = rackType(r)
            const score = qualityScore(r.conditions)
            const ql = qualityLabel(score)
            const condOpen = showConditions[r.id]
            const bottleCount = bottles.filter(b => b.rackId === r.id).reduce((s, b) => s + b.count, 0)
            return (
              <div key={r.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3">
                {/* Name + Emoji + Sortierung */}
                <div className="flex items-center gap-2 mb-3">
                  {racks.length > 1 && (
                    <div className="flex flex-col flex-none">
                      <button onClick={() => move(idx, -1)} disabled={idx === 0}
                        className="p-0.5 text-gray-400 disabled:opacity-20"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                      <button onClick={() => move(idx, 1)} disabled={idx === racks.length - 1}
                        className="p-0.5 text-gray-400 disabled:opacity-20"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    </div>
                  )}
                  <select value={r.emoji} onChange={e => renameRack(r.id, r.label, e.target.value)} className="bg-transparent text-xl">
                    {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
                  </select>
                  <input className="input py-1.5 text-sm flex-1"
                    value={r.label} onChange={e => renameRack(r.id, e.target.value, r.emoji)} />
                  <span className="text-[10px] text-gray-400 flex-none">{bottleCount}🍷</span>
                  <button onClick={() => { if (confirm(`Regal "${r.label}" + Inhalte löschen?`)) removeRack(r.id) }}
                    className="text-gray-300 hover:text-red-500 px-1">🗑️</button>
                </div>

                {/* Regaltyp Auswahl */}
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1.5">Regaltyp</p>
                <div className="flex gap-1.5 mb-3">
                  {[
                    { id: 'free',  label: '📦 Frei',   desc: 'Ohne Positionen' },
                    { id: 'slots', label: '📏 Fächer',  desc: 'Benannte Plätze' },
                    { id: 'grid',  label: '🔲 Gitter',  desc: 'Reihen × Spalten' },
                  ].map(t => (
                    <button key={t.id} onClick={() => switchType(r, t.id)}
                      className={`flex-1 rounded-xl px-2 py-2 text-center transition-colors ${
                        type === t.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}>
                      <span className="text-sm font-semibold block">{t.label}</span>
                      <span className={`text-[10px] block ${type === t.id ? 'text-white/70' : 'text-gray-400'}`}>{t.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Fächer-Verwaltung */}
                {type === 'slots' && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.slots.map(s => (
                        <div key={s} className="flex items-center bg-white dark:bg-gray-800 rounded-full pl-2.5 pr-1 py-1 gap-1 text-xs">
                          <span className="font-medium">{s}</span>
                          <button onClick={() => {
                            const nl = prompt('Neuer Name für ' + s, s)
                            if (nl && nl !== s) renameSlot(r.id, s, nl)
                          }} className="text-gray-400 hover:text-gray-600">✎</button>
                          <button onClick={() => { if (confirm(`Fach "${s}" löschen?`)) removeSlot(r.id, s) }}
                            className="text-gray-300 hover:text-red-500">✕</button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const l = prompt('Bezeichnung des Fachs', String(r.slots.length + 1))
                        if (l) addSlot(r.id, l)
                      }} className="text-xs text-primary-600 font-semibold px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full">+ Fach</button>
                    </div>
                  </div>
                )}

                {/* Gitter-Konfiguration */}
                {type === 'grid' && (
                  <div className="mb-3">
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {GRID_PRESETS.map(p => (
                        <button key={p.label} onClick={() => setRackGrid(r.id, p.rows, p.cols)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            r.rows === p.rows && r.cols === p.cols
                              ? 'bg-primary-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                          }`}>{p.label}</button>
                      ))}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-xl px-2 py-1">
                        <input type="number" min="1" max="20" className="w-10 text-center text-xs font-semibold bg-transparent outline-none"
                          value={r.rows || ''} placeholder="R"
                          onChange={e => setRackGrid(r.id, Math.max(1, Math.min(20, Number(e.target.value) || 1)), r.cols || 1)} />
                        <span className="text-gray-400 text-xs">×</span>
                        <input type="number" min="1" max="20" className="w-10 text-center text-xs font-semibold bg-transparent outline-none"
                          value={r.cols || ''} placeholder="S"
                          onChange={e => setRackGrid(r.id, r.rows || 1, Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
                      </div>
                      <span className="text-[10px] text-gray-400 self-center">= {(r.rows || 0) * (r.cols || 0)} Plätze</span>
                    </div>
                    {/* Grid-Vorschau */}
                    {r.rows > 0 && r.cols > 0 && (() => {
                      const occupied = bottles.filter(b => b.rackId === r.id && b.row != null && b.col != null && b.count > 0)
                      return (
                        <div className="overflow-x-auto rounded-xl bg-white dark:bg-gray-800 p-2">
                          <table className="border-collapse mx-auto">
                            <tbody>
                              {Array.from({ length: r.rows }, (_, ri) => (
                                <tr key={ri}>
                                  <td className="text-[9px] text-gray-400 pr-1 text-right w-5">{ri + 1}</td>
                                  {Array.from({ length: r.cols }, (_, ci) => {
                                    const here = occupied.filter(b => b.row === ri + 1 && b.col === ci + 1)
                                    const total = here.reduce((s, b) => s + b.count, 0)
                                    return (
                                      <td key={ci} className={`w-7 h-7 text-center border border-gray-100 dark:border-gray-700 text-[10px] rounded-sm ${
                                        total > 0 ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-bold' : 'text-gray-300 dark:text-gray-600'
                                      }`}>
                                        {total > 0 ? total : '·'}
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                              <tr>
                                <td />
                                {Array.from({ length: r.cols }, (_, ci) => (
                                  <td key={ci} className="text-[9px] text-gray-400 text-center">{ci + 1}</td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Lagerbedingungen (aufklappbar) */}
                <button onClick={() => setShowConditions(p => ({ ...p, [r.id]: !p[r.id] }))}
                  className="flex items-center justify-between w-full py-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Lagerbedingungen</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ql.cls}`}>
                      {score}/100
                    </span>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${condOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {condOpen && (
                  <div className="space-y-2 mt-1">
                    {COND_KEYS.map(({ key, label }) => {
                      const current = r.conditions?.[key]
                      return (
                        <div key={key}>
                          <p className="text-[11px] text-gray-500 dark:text-gray-300 mb-0.5">{label}</p>
                          <div className="flex flex-wrap gap-1">
                            {CONDITION_OPTIONS[key].map(opt => (
                              <button key={opt.id}
                                onClick={() => setRackConditions(r.id, { [key]: opt.id })}
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  current === opt.id
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                                }`}
                              >{opt.label}</button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    <p className="text-[10px] text-gray-400 italic">
                      Beeinflusst das effektive Trinkfenster der Flaschen in diesem Regal.
                    </p>
                  </div>
                )}

                {/* Sensor-Anzeige */}
                {shellyConfig && r.conditions?.shellyDeviceId && (() => {
                  const reading = sensorReadings[r.id]
                  if (!reading) return null
                  return (
                    <div className="mt-2 flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-3 py-2">
                      <span className={`w-2 h-2 rounded-full flex-none ${reading.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      {reading.temperature != null && (
                        <span className="text-sm font-semibold">🌡️ {reading.temperature.toFixed(1)}°C</span>
                      )}
                      {reading.humidity != null && (
                        <span className="text-sm font-semibold">💧 {reading.humidity.toFixed(0)}%</span>
                      )}
                      {!reading.online && <span className="text-[10px] text-gray-400">Offline</span>}
                    </div>
                  )
                })()}

                {/* Sensor-Zuweisung */}
                {shellyConfig && shellyDevices && (
                  <div className="mt-2">
                    <select
                      value={r.conditions?.shellyDeviceId || ''}
                      onChange={e => setRackSensor(r.id, e.target.value)}
                      className="input text-xs py-1.5 w-full"
                    >
                      <option value="">📡 Kein Sensor</option>
                      {shellyDevices.map(d => (
                        <option key={d.id} value={d.id}>
                          📡 {d.name} {d.hasTemp ? '🌡️' : ''}{d.hasHum ? '💧' : ''} {d.online ? '' : '(offline)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          })}

          {/* Shelly Sensor-Konfiguration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button onClick={() => setShowShelly(p => !p)}
              className="flex items-center justify-between w-full mb-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">📡 Shelly Sensoren</p>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${showShelly ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showShelly && (
              <div className="space-y-2">
                {shellyConfig ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex-1">✓ Verbunden (Server: {shellyConfig.server})</span>
                    <button onClick={loadDevices} disabled={shellyLoading}
                      className="text-xs text-primary-600 font-semibold">↻ Aktualisieren</button>
                    <button onClick={() => { setShellyConfig(null, null); setShellyDevices(null) }}
                      className="text-xs text-red-500 font-semibold">Trennen</button>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-gray-500">Shelly Cloud Auth-Key und Server-ID aus der Shelly-App (Einstellungen → Autorisierung).</p>
                    <input className="input text-sm py-1.5" placeholder="Auth-Key"
                      value={shellyAuth.authKey}
                      onChange={e => setShellyAuth(p => ({ ...p, authKey: e.target.value }))} />
                    <input className="input text-sm py-1.5" placeholder='Server-ID (z.B. "eu")'
                      value={shellyAuth.server}
                      onChange={e => setShellyAuth(p => ({ ...p, server: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
                    <button
                      disabled={!shellyAuth.authKey || !shellyAuth.server || shellyLoading}
                      onClick={async () => {
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
                      }}
                      className="btn-primary text-sm py-1.5 w-full disabled:opacity-40"
                    >
                      {shellyLoading ? 'Verbinde…' : 'Verbinden'}
                    </button>
                  </>
                )}
                {shellyError && <p className="text-xs text-red-500">{shellyError}</p>}
                {shellyDevices && !shellyDevices.length && (
                  <p className="text-xs text-gray-400">Keine Temperatur-/Feuchtigkeitssensoren gefunden.</p>
                )}
              </div>
            )}
          </div>

          {/* Neues Regal */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">+ Neues Regal</p>
            <div className="flex gap-1.5 mb-2">
              {[
                { id: 'free',  label: '📦 Frei' },
                { id: 'slots', label: '📏 Fächer' },
                { id: 'grid',  label: '🔲 Gitter' },
              ].map(t => (
                <button key={t.id} onClick={() => setNewType(t.id)}
                  className={`flex-1 rounded-xl px-2 py-1.5 text-xs font-semibold text-center transition-colors ${
                    newType === t.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>{t.label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg px-2 text-lg">
                {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
              </select>
              <input className="input py-2 text-sm flex-1"
                placeholder='z.B. "Regal Garage"' value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createRack() }} />
              <button onClick={createRack}
                disabled={!newLabel.trim()}
                className="btn-primary text-sm px-4 disabled:opacity-40">
                Anlegen
              </button>
            </div>
          </div>

          <div className="pt-4 pb-4">
            <button onClick={onClose} className="btn-primary w-full">Fertig</button>
          </div>
        </div>
      </div>
    </>
  )
}
