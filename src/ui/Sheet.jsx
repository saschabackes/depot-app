import { useEffect, useId, useRef } from 'react'

// Escape schließt nur das oberste offene Sheet
const stack = []
function onKey(e) {
  if (e.key !== 'Escape' || stack.length === 0) return
  e.stopPropagation()
  stack[stack.length - 1].current?.()
}

export function useTopmostEscape(onClose) {
  const ref = useRef(onClose)
  ref.current = onClose
  useEffect(() => {
    if (stack.length === 0) window.addEventListener('keydown', onKey, true)
    stack.push(ref)
    return () => {
      stack.splice(stack.indexOf(ref), 1)
      if (stack.length === 0) window.removeEventListener('keydown', onKey, true)
    }
  }, [])
}

// Bottom-Sheet mit Kopfzeile „Abbrechen · Titel · Aktion“
export default function Sheet({ title, onClose, cancelLabel = 'Abbrechen', confirmLabel, onConfirm, confirmDisabled = false, children, z = 50 }) {
  const titleId = useId()
  useTopmostEscape(onClose)

  return (
    <div className="fixed inset-0" style={{ zIndex: z }}>
      <div className="absolute inset-0 bg-black/35 fade-enter" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 max-h-[92dvh] flex flex-col bg-gray-50 dark:bg-gray-900 rounded-t-[22px] sheet-enter max-w-xl mx-auto">
        <div className="flex justify-center pt-2"><span className="w-9 h-[5px] rounded-full bg-gray-300 dark:bg-gray-600" /></div>
        <div className="flex items-center px-2 pt-1">
          <div className="flex-1">
            <button onClick={onClose} className="min-h-[44px] px-3 text-[17px] text-primary-500 dark:text-primary-300">{cancelLabel}</button>
          </div>
          <h2 id={titleId} className="flex-none max-w-[50%] truncate text-[17px] font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <div className="flex-1 flex justify-end">
            {confirmLabel && (
              <button onClick={onConfirm} disabled={confirmDisabled}
                className="min-h-[44px] px-3 text-[17px] font-semibold text-primary-500 dark:text-primary-300 disabled:opacity-40">{confirmLabel}</button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain pt-2" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
