import { confirmAction } from '../ui/feedback'
import { MODULES_ENABLED } from '../branding'

// Leiste im Auswahlmodus (über der Tab-Leiste)
export default function SelectionBar({ count, onDelete, onCancel, label = 'Löschen' }) {
  async function handleDelete() {
    const ok = await confirmAction({
      title: `${count} ${count === 1 ? 'Eintrag' : 'Einträge'} ${label.toLowerCase()}?`,
      message: 'Das lässt sich nicht rückgängig machen.',
      confirmLabel: label, destructive: true,
    })
    if (ok) onDelete()
  }

  return (
    <div className="fixed inset-x-3 z-40 max-w-md mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-[14px] shadow-xl flex items-center gap-2 pl-4 pr-1.5 py-1.5"
      style={{ bottom: `calc(${MODULES_ENABLED ? 58 : 12}px + env(safe-area-inset-bottom, 0px))` }}>
      <span className="flex-1 text-callout font-semibold text-gray-900 dark:text-gray-100">{count} ausgewählt</span>
      <button onClick={handleDelete} disabled={!count}
        className="min-h-[40px] px-3 rounded-lg text-callout font-semibold text-expired dark:text-expired-dark disabled:opacity-40">{label}</button>
      <button onClick={onCancel} className="min-h-[40px] px-3 rounded-lg text-callout font-semibold text-primary-500 dark:text-primary-300">Fertig</button>
    </div>
  )
}

export function ClearAllButton({ onClear, label, count }) {
  if (!count) return null
  async function handle() {
    if (await confirmAction({ title: `Alle ${count} löschen?`, message: 'Das lässt sich nicht rückgängig machen.', confirmLabel: 'Alle löschen', destructive: true })) onClear()
  }
  return (
    <button onClick={handle} className="min-h-[44px] px-2 text-footnote font-semibold text-expired dark:text-expired-dark">
      {label}
    </button>
  )
}
