import { useState, useRef, useEffect } from 'react'
import { useFreezer, parseVoiceInput, autoCategory } from './store'
import Icon from '../../ui/Icon'
import { showToast } from '../../ui/feedback'

// Häufigkeit aus aktuellem Bestand + recentNames ableiten
function suggestions(items, recentNames) {
  const counts = new Map()
  items.forEach(it => counts.set(it.name, (counts.get(it.name) || 0) + 1))
  recentNames.forEach((n, i) => {
    if (!counts.has(n)) counts.set(n, 0.5 - i / 100) // jüngere zuerst
  })
  return [...counts.entries()].sort((a,b) => b[1] - a[1]).slice(0, 10).map(([n]) => n)
}

export default function QuickAddBar() {
  const items = useFreezer(s => s.items)
  const recentNames = useFreezer(s => s.recentNames)
  const storages = useFreezer(s => s.storages)
  const lastUsed = useFreezer(s => s.lastUsedCompartment)
  const quickAddByName = useFreezer(s => s.quickAddByName)
  const addItem = useFreezer(s => s.addItem)
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  const chips = suggestions(items, recentNames)
  const lastStorage = storages.find(s => s.id === lastUsed?.storageId) || storages[0]
  const lastComp = lastStorage?.compartments.find(c => c.id === lastUsed?.compartmentId) || (!lastUsed && lastStorage?.compartments[0])
  const lastLabel = lastStorage ? (lastComp?.label || lastStorage.label) : 'das erste Fach'

  function quickByText() {
    const t = text.trim()
    if (!t) return
    // Erst Sprach-Parser probieren (verstehen wir Ortsangaben?)
    const parsed = parseVoiceInput(t, storages)
    if (parsed && (parsed.storageId || parsed.portions > 1)) {
      addItem({
        name: parsed.name,
        category: autoCategory(parsed.name),
        portions: parsed.portions,
        storageId: parsed.storageId || lastUsed?.storageId || storages[0]?.id,
        compartmentId: parsed.compartmentId || lastUsed?.compartmentId || storages[0]?.compartments[0]?.id,
      })
      showToast(`${parsed.portions} × ${parsed.name} eingefroren`, { duration: 2500 })
    } else {
      quickAddByName(t)
      showToast(`${t} → ${lastLabel}`, { duration: 2500 })
    }
    setText('')
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { showToast('Spracheingabe wird in diesem Browser nicht unterstützt.', { duration: 2500 }); return }
    if (listening) { recRef.current?.stop?.(); return }
    const rec = new SR()
    rec.lang = 'de-DE'; rec.interimResults = false; rec.maxAlternatives = 1
    rec.onresult = (e) => {
      setText(e.results[0][0].transcript)
      setListening(false)
    }
    rec.onerror = () => { setListening(false); showToast('Sprache nicht verstanden.', { duration: 2500 }) }
    rec.onend   = () => setListening(false)
    rec.start()
    recRef.current = rec
    setListening(true)
  }
  useEffect(() => () => recRef.current?.abort?.(), [])

  return (
    <section className="px-4">
      <div className="bg-white dark:bg-gray-800 rounded-card px-2 py-1.5">
        <div className="flex items-center gap-1">
          <input
            className="flex-1 min-w-0 bg-transparent outline-none px-2 py-2 text-body text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            placeholder="Schnell einfrieren, z. B. „2 Lasagne Keller“"
            aria-label="Schnell einfrieren"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') quickByText() }}
          />
          <button onClick={startVoice} aria-label={listening ? 'Spracheingabe beenden' : 'Spracheingabe'}
            className={`flex-none w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              listening ? 'bg-expired text-white animate-pulse' : 'text-primary-500 dark:text-primary-300'}`}>
            <Icon name="mic" size={22} />
          </button>
          <button onClick={quickByText} disabled={!text.trim()} aria-label="Hinzufügen"
            className="flex-none w-11 h-11 rounded-full bg-primary-500 text-white flex items-center justify-center disabled:opacity-40">
            <Icon name="plus" size={22} strokeWidth={2.4} />
          </button>
        </div>

        {chips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 pt-1 pb-1.5">
            {chips.map(name => (
              <button key={name}
                onClick={() => { quickAddByName(name); showToast(`+1 ${name} → ${lastLabel}`, { duration: 2000 }) }}
                className="flex-none min-h-[34px] px-3 rounded-full bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-200 text-[14px] font-semibold active:scale-95 transition-transform">
                + {name}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="px-4 pt-1.5 text-footnote text-gray-500 dark:text-gray-400">
        Landet in {lastLabel}. Menge und Ort werden erkannt, z. B. „3 Lasagne Keller Korb 2“.
      </p>
    </section>
  )
}
