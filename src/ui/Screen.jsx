import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

// Seite mit großem Titel (iOS-Stil). Beim Scrollen erscheint der Titel klein in der Kopfleiste.
export default function Screen({ title, eyebrow, back, actions, children, className = '', largeTitle = true }) {
  const titleRef = useRef(null)
  const [compact, setCompact] = useState(!largeTitle)

  useEffect(() => {
    if (!largeTitle || !titleRef.current) return
    const obs = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { threshold: 0, rootMargin: '-44px 0px 0px 0px' })
    obs.observe(titleRef.current)
    return () => obs.disconnect()
  }, [largeTitle])

  const hasBar = back || actions || !largeTitle

  return (
    <div className={`flex-1 overflow-y-auto overscroll-contain bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div
        className={`sticky top-0 z-20 transition-colors ${compact ? 'bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-700/70' : ''}`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className={`flex items-center px-2 ${hasBar ? 'h-11' : 'h-2'}`}>
          <div className="flex-1 min-w-0 flex">
            {back && (
              <button onClick={back.onClick} className="flex items-center gap-0.5 min-h-[44px] pr-2 text-primary-500 dark:text-primary-300 text-[17px]">
                <Icon name="back" size={22} strokeWidth={2.2} />
                <span className="truncate max-w-[140px]">{back.label}</span>
              </button>
            )}
          </div>
          <div className={`flex-none max-w-[55%] truncate text-[17px] font-semibold text-gray-900 dark:text-gray-100 transition-opacity ${compact ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!compact}>
            {title}
          </div>
          <div className="flex-1 min-w-0 flex justify-end items-center">{actions}</div>
        </div>
      </div>

      {largeTitle && (
        <div ref={titleRef} className="px-5 pt-1 pb-3">
          {eyebrow && <p className="text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{eyebrow}</p>}
          <h1 className="text-large-title text-gray-900 dark:text-gray-50">{title}</h1>
        </div>
      )}

      <div style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </div>
    </div>
  )
}

// Rundes bzw. Text-Aktionsfeld für die Kopfleiste (mind. 44×44)
export function BarButton({ icon, label, onClick, children, prominent = false }) {
  return (
    <button onClick={onClick} aria-label={label}
      className={`min-w-[44px] min-h-[44px] px-2 flex items-center justify-center rounded-full text-[17px] ${
        prominent ? 'font-semibold' : ''} text-primary-500 dark:text-primary-300 active:opacity-60`}>
      {icon ? <Icon name={icon} size={24} strokeWidth={2.1} /> : children}
    </button>
  )
}
