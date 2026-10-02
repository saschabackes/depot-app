import Icon from './Icon'

export default function TabBar({ tabs, active, onChange }) {
  return (
    <nav aria-label="Hauptnavigation"
      className="fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="grid max-w-xl mx-auto" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(t => {
          const on = t.id === active
          return (
            <button key={t.id} onClick={() => onChange(t.id)} aria-current={on ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 pt-1.5 pb-1 min-h-[50px] text-caption ${
                on ? 'text-primary-500 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
              <Icon name={t.icon} size={26} />
              {t.label}
              {t.badge > 0 && (
                <span className="absolute top-1 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-expired text-white text-[11px] font-bold leading-[18px]">
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
