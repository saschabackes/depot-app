import { create } from 'zustand'
import { useTopmostEscape } from './Sheet'

// Zentrale Rückfragen und Hinweise – ersetzt window.confirm()/alert()
const useFeedback = create(() => ({ dialog: null, toast: null }))

let toastTimer
export function showToast(message, { actionLabel, onAction, duration = 5000 } = {}) {
  clearTimeout(toastTimer)
  useFeedback.setState({ toast: { message, actionLabel, onAction, id: Date.now() } })
  toastTimer = setTimeout(() => useFeedback.setState({ toast: null }), duration)
}

// Rückfrage als Action-Sheet: `if (await confirmAction({...}))`
export function confirmAction({ title, message, confirmLabel = 'Bestätigen', destructive = false, cancelLabel = 'Abbrechen' }) {
  return new Promise(resolve => {
    useFeedback.setState({ dialog: { title, message, confirmLabel, destructive, cancelLabel, resolve } })
  })
}

// Hinweis mit nur einer Taste
export function notify(title, message) {
  return new Promise(resolve => {
    useFeedback.setState({ dialog: { title, message, confirmLabel: 'OK', cancelLabel: null, resolve } })
  })
}

function ActionSheet({ dialog }) {
  const close = result => { useFeedback.setState({ dialog: null }); dialog.resolve(result) }
  useTopmostEscape(() => close(false))
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/35 fade-enter" onClick={() => close(false)} />
      <div role="alertdialog" aria-modal="true" aria-label={dialog.title}
        className="absolute inset-x-2 sheet-enter max-w-md mx-auto flex flex-col gap-2"
        style={{ bottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-[14px] overflow-hidden text-center">
          <div className="px-5 py-4">
            <p className="text-callout font-semibold text-gray-900 dark:text-gray-100">{dialog.title}</p>
            {dialog.message && <p className="text-footnote text-gray-500 dark:text-gray-400 mt-1">{dialog.message}</p>}
          </div>
          <button onClick={() => close(true)} autoFocus
            className={`w-full min-h-[56px] border-t border-gray-200 dark:border-gray-700 text-[18px] ${
              dialog.destructive ? 'text-expired dark:text-expired-dark' : 'text-primary-500 dark:text-primary-300 font-semibold'}`}>
            {dialog.confirmLabel}
          </button>
        </div>
        {dialog.cancelLabel && (
          <button onClick={() => close(false)}
            className="w-full min-h-[56px] bg-white dark:bg-gray-800 rounded-[14px] text-[18px] font-semibold text-primary-500 dark:text-primary-300">
            {dialog.cancelLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function Toast({ toast }) {
  return (
    <div role="status" className="fixed inset-x-4 z-[85] max-w-md mx-auto fade-enter"
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center gap-3 rounded-[14px] bg-gray-900 dark:bg-gray-700 text-white pl-4 pr-2 py-2 shadow-xl">
        <p className="flex-1 text-callout">{toast.message}</p>
        {toast.actionLabel && (
          <button onClick={() => { useFeedback.setState({ toast: null }); toast.onAction?.() }}
            className="min-h-[40px] px-3 rounded-lg text-callout font-semibold text-primary-200">{toast.actionLabel}</button>
        )}
      </div>
    </div>
  )
}

export function FeedbackHost() {
  const dialog = useFeedback(s => s.dialog)
  const toast = useFeedback(s => s.toast)
  return (
    <>
      {toast && <Toast key={toast.id} toast={toast} />}
      {dialog && <ActionSheet dialog={dialog} />}
    </>
  )
}
