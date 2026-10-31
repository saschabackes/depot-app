import { useEffect, useState } from 'react'
import Icon from '../../ui/Icon'
import { useTopmostEscape } from '../../ui/Sheet'
import { getPageUrl } from './store'

// Runder Abhak-Kreis mit 44×44-Tippfläche (wie in der Einkaufsliste)
export function CheckCircle({ checked, onClick, label }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick() }} aria-label={label} aria-pressed={checked}
      className="relative z-10 w-11 h-11 -ml-2.5 -my-1 flex-none flex items-center justify-center">
      <span className={`w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center transition-colors ${
        checked ? 'bg-primary-500 border-primary-500 text-white dark:bg-primary-400 dark:border-primary-400' : 'border-gray-300 dark:border-gray-600'}`}>
        {checked && <Icon name="check" size={15} strokeWidth={3} />}
      </span>
    </button>
  )
}

// Auswahl per Tippen, wenn die Optionen zu lang für eine Segmentleiste sind
export function Chips({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = o.id === value
        return (
          <button key={o.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.id)}
            className={`min-h-[40px] px-3.5 rounded-full text-callout font-semibold border transition-colors ${
              on ? 'bg-primary-500 border-primary-500 text-white dark:bg-primary-400 dark:border-primary-400 dark:text-gray-900'
                 : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Block({ children }) {
  return <div className="bg-white dark:bg-gray-800 rounded-card p-4 space-y-3">{children}</div>
}

function usePageUrl(path) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let alive = true
    setUrl(null)
    getPageUrl(path).then(u => { if (alive) setUrl(u) })
    return () => { alive = false }
  }, [path])
  return url
}

// Vorschaubild einer Seite
export function PageThumb({ page, onOpen, onRemove, label }) {
  const url = usePageUrl(page.path)
  return (
    <div className="relative flex-none w-24 h-32">
      <button onClick={onOpen} aria-label={label} className="w-full h-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700">
        {url && <img src={url} alt="" className="w-full h-full object-cover" />}
      </button>
      {onRemove && (
        <button onClick={onRemove} aria-label="Seite entfernen"
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gray-900/80 text-white flex items-center justify-center">
          <Icon name="close" size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

// Vollbild-Ansicht: Tippen vergrößert, Pfeile blättern
export function Lightbox({ pages, index, onClose }) {
  const [i, setI] = useState(index)
  const [zoom, setZoom] = useState(false)
  const page = pages[i]
  const url = usePageUrl(page.path)
  useTopmostEscape(onClose)

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Seite ansehen">
      <div className="flex-none flex items-center justify-between px-2 text-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <button onClick={onClose} className="min-h-[44px] px-3 text-[17px]">Schließen</button>
        <span className="text-callout">Seite {i + 1} von {pages.length}</span>
        <span className="w-[88px]" />
      </div>
      <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center" onClick={() => setZoom(z => !z)}>
        {url
          ? <img src={url} alt={`Seite ${i + 1}`} className={zoom ? 'w-[250%] max-w-none' : 'max-w-full max-h-full object-contain'} />
          : <span className="text-white/70 text-callout">Lädt …</span>}
      </div>
      {pages.length > 1 && (
        <div className="flex-none flex justify-between px-4 text-white" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
          <button onClick={() => { setI(i - 1); setZoom(false) }} disabled={i === 0} aria-label="Vorherige Seite"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30"><Icon name="back" size={26} /></button>
          <button onClick={() => { setI(i + 1); setZoom(false) }} disabled={i === pages.length - 1} aria-label="Nächste Seite"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30"><Icon name="chevron" size={26} /></button>
        </div>
      )}
    </div>
  )
}
