import { useEffect, useRef, useState } from 'react'
import Icon from '../ui/Icon'
import { Segmented } from '../ui/Controls'
import { useTopmostEscape } from '../ui/Sheet'
import { scaleIngredientLine } from '../utils/scaleRecipe'

const storageKey = id => `depot_cook_${id}`
function loadProgress(id) {
  try { return JSON.parse(localStorage.getItem(storageKey(id))) ?? {} } catch { return {} }
}
function saveProgress(id, data) {
  try { localStorage.setItem(storageKey(id), JSON.stringify(data)) } catch { /* privater Modus */ }
}

// Hält den Bildschirm wach (Screen Wake Lock API); nach App-Wechsel neu anfordern
function useWakeLock() {
  const [status, setStatus] = useState('pending') // pending | on | unsupported
  useEffect(() => {
    if (!('wakeLock' in navigator)) { setStatus('unsupported'); return }
    let lock = null
    let cancelled = false
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
        if (!cancelled) setStatus('on')
      } catch {
        if (!cancelled) setStatus('unsupported')
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') request() }
    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [])
  return status
}

export default function CookMode({ recipe, factor = 1, people, onClose }) {
  const steps = recipe.steps ?? []
  const ingredients = (recipe.ingredients ?? []).map(i => (typeof i === 'string' ? i : i.name))
  const saved = loadProgress(recipe.id)
  const [current, setCurrent] = useState(Math.min(saved.current ?? 0, Math.max(0, steps.length - 1)))
  const [checked, setChecked] = useState(new Set(saved.checked ?? []))
  const [view, setView] = useState(steps.length ? 'steps' : 'ingredients')
  const wake = useWakeLock()
  const stepRefs = useRef([])
  useTopmostEscape(onClose)

  useEffect(() => { saveProgress(recipe.id, { current, checked: [...checked] }) }, [current, checked, recipe.id])
  useEffect(() => { stepRefs.current[current]?.scrollIntoView({ block: 'center', behavior: 'smooth' }) }, [current, view])

  const last = current >= steps.length - 1
  function finish() {
    try { localStorage.removeItem(storageKey(recipe.id)) } catch { /* egal */ }
    onClose()
  }
  function toggleIngredient(i) {
    setChecked(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next })
  }

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-gray-900 flex flex-col fade-enter" role="dialog" aria-modal="true" aria-label={`Kochmodus: ${recipe.title}`}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center px-2 h-12">
        <div className="flex-1">
          <button onClick={onClose} className="min-h-[44px] px-3 text-[17px] text-primary-500 dark:text-primary-300">Schließen</button>
        </div>
        <h1 className="flex-none max-w-[55%] truncate text-[17px] font-semibold text-gray-900 dark:text-gray-100">{recipe.title}</h1>
        <div className="flex-1" />
      </div>

      <div className="px-4 pb-2 space-y-2">
        {steps.length > 0 && ingredients.length > 0 && (
          <Segmented label="Ansicht" value={view} onChange={setView}
            options={[{ id: 'steps', label: `Schritte · ${current + 1}/${steps.length}` }, { id: 'ingredients', label: `Zutaten${people ? ` · ${people} P.` : ''}` }]} />
        )}
        <p className="px-1 text-footnote text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          {wake === 'on'
            ? <><Icon name="check" size={14} strokeWidth={2.6} className="text-primary-500 dark:text-primary-300" />Bildschirm bleibt an</>
            : wake === 'unsupported'
              ? 'Dieses Gerät erlaubt kein Wachhalten – ggf. Auto-Sperre in den Einstellungen verlängern.'
              : 'Bildschirm wird wach gehalten …'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {view === 'steps' ? (
          <ol className="space-y-2">
            {steps.map((step, i) => {
              const state = i === current ? 'current' : i < current ? 'done' : 'next'
              return (
                <li key={i} ref={el => (stepRefs.current[i] = el)}>
                  <button onClick={() => setCurrent(i)} aria-current={state === 'current' ? 'step' : undefined}
                    className={`w-full text-left rounded-card flex gap-3 transition-colors ${
                      state === 'current'
                        ? 'bg-white dark:bg-gray-800 ring-2 ring-primary-500 dark:ring-primary-300 px-4 py-5'
                        : 'px-4 py-2.5'}`}>
                    <span className={`flex-none rounded-full font-bold flex items-center justify-center ${
                      state === 'current' ? 'w-9 h-9 text-callout bg-primary-500 text-white'
                        : state === 'done' ? 'w-7 h-7 text-footnote bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        : 'w-7 h-7 text-footnote bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-200'}`}>
                      {state === 'done' ? <Icon name="check" size={15} strokeWidth={2.8} /> : i + 1}
                    </span>
                    <span className={`flex-1 leading-relaxed ${
                      state === 'current' ? 'text-[21px] leading-[30px] text-gray-900 dark:text-gray-50'
                        : state === 'done' ? 'text-callout text-gray-400 dark:text-gray-500 line-clamp-1'
                        : 'text-callout text-gray-600 dark:text-gray-300 line-clamp-2'}`}>
                      {step}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        ) : (
          <ul className="bg-white dark:bg-gray-800 rounded-card divide-y divide-gray-100 dark:divide-gray-700">
            {ingredients.map((ing, i) => {
              const on = checked.has(i)
              return (
                <li key={i}>
                  <button onClick={() => toggleIngredient(i)} aria-pressed={on}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[52px] text-left">
                    <span className={`flex-none w-6 h-6 rounded-full border-2 flex items-center justify-center ${on ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                      {on && <Icon name="check" size={14} strokeWidth={3} />}
                    </span>
                    <span className={`flex-1 text-[18px] leading-snug ${on ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                      {scaleIngredientLine(ing, factor)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {view === 'steps' && steps.length > 0 && (
        <div className="px-4 pt-2 pb-3 flex gap-2.5">
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
            className="btn-secondary flex-1 min-h-[56px] disabled:opacity-40" aria-label="Vorheriger Schritt">
            <Icon name="back" size={22} strokeWidth={2.4} />Zurück
          </button>
          <button onClick={() => (last ? finish() : setCurrent(c => c + 1))} className="btn-primary flex-[2] min-h-[56px] text-[17px]">
            {last ? 'Fertig – guten Appetit!' : <>Weiter<Icon name="chevron" size={22} strokeWidth={2.4} /></>}
          </button>
        </div>
      )}
    </div>
  )
}
