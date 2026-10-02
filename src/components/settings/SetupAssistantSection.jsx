import useStore from '../../store/useStore'
import { useFreezer } from '../../modules/freezer/store'
import { useCellar } from '../../modules/cellar/store'
import { confirmAction } from '../../ui/feedback'

// ── Setup-Assistenten neu starten ────────────────────────────────────────────

function SetupAssistantSection({ onClose }) {
  const { restartSpiceSetup } = useStore()
  const restartFreezer = useFreezer(s => s.restartSetup)
  const restartCellar = useCellar(s => s.restartSetup)

  const modules = [
    { label: '🌿 Gewürze', restart: restartSpiceSetup },
    { label: '❄️ Tiefkühl', restart: restartFreezer },
    { label: '🍷 Weinkeller', restart: restartCellar },
  ]

  return (
    <div>
      <h3 className="px-1 pb-2 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Setup-Assistenten</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Starte den Einrichtungsassistenten für ein Modul erneut, um Lagerorte und Einstellungen anzupassen.
      </p>
      <div className="space-y-2">
        {modules.map(m => (
          <button key={m.label} onClick={async () => { if (await confirmAction({ title: `Setup-Assistent für ${m.label.slice(3)} neu starten?`, confirmLabel: 'Neu starten' })) { m.restart(); onClose() } }}
            className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-900/40 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span>{m.label}</span>
            <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold">Neu starten ↺</span>
          </button>
        ))}
      </div>
    </div>
  )
}


export default SetupAssistantSection
