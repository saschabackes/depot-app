import useStore from '../../store/useStore'
import { Segmented } from '../../ui/Controls'

// ── Darstellung (Dark Mode) ───────────────────────────────────────────────────

function AppearanceSection() {
  const theme = useStore(s => s.theme)
  const setTheme = useStore(s => s.setTheme)
  return (
    <div>
      <h3 className="px-1 pb-2 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Darstellung</h3>
      <Segmented label="Darstellung" value={theme} onChange={setTheme}
        options={[{ id: 'system', label: 'Automatisch' }, { id: 'light', label: 'Hell' }, { id: 'dark', label: 'Dunkel' }]} />
    </div>
  )
}

export default AppearanceSection
