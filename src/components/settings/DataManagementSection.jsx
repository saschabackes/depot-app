import { useState, useMemo } from 'react'
import useStore from '../../store/useStore'
import { useFreezer } from '../../modules/freezer/store'
import { useCellar } from '../../modules/cellar/store'

export default function DataManagementSection() {
  const { spices, clearAllSpices, recipes, deleteRecipe } = useStore()
  const { items: freezerItems, clearAllItems } = useFreezer()
  const { bottles, clearAllBottles } = useCellar()

  const recipeSources = useMemo(() => {
    const map = {}
    for (const r of recipes) {
      const src = r.sourceType || 'manual'
      if (!map[src]) map[src] = []
      map[src].push(r)
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length)
  }, [recipes])

  return (
    <div>
      <h3 className="px-1 pb-2 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Daten verwalten</h3>
      <p className="text-xs text-gray-400 mb-3">Alle Einträge eines Bereichs auf einmal löschen. Diese Aktion kann nicht rückgängig gemacht werden.</p>
      <div className="space-y-2">
        <ClearRow label="Alle Gewürze" count={spices.length} emoji="🌿" onClear={clearAllSpices} />
        <ClearRow label="Alle TK-Einträge" count={freezerItems.length} emoji="❄️" onClear={clearAllItems} />
        <ClearRow label="Alle Weine" count={bottles.length} emoji="🍷" onClear={clearAllBottles} />
      </div>
      {recipeSources.length > 0 && (
        <>
          <p className="text-xs text-gray-400 mt-4 mb-2">Rezepte nach Quelle löschen:</p>
          <div className="space-y-2">
            {recipeSources.map(([src, items]) => (
              <ClearRow
                key={src}
                label={`${src}-Rezepte`}
                count={items.length}
                emoji="📖"
                onClear={() => items.forEach(r => deleteRecipe(r.id))}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ClearRow({ label, count, emoji, onClear }) {
  const [confirming, setConfirming] = useState(false)

  if (count === 0) return null

  return (
    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
        <span className="text-xs text-gray-400">({count})</span>
      </div>
      {confirming ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { onClear(); setConfirming(false) }}
            className="text-xs font-bold text-white bg-expired rounded-lg px-2.5 py-1 hover:bg-expired transition-colors"
          >
            Endgültig löschen
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs text-gray-500 px-2 py-1"
          >
            Abbrechen
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs font-semibold text-expired hover:text-expired dark:text-expired-dark px-2 py-1 rounded-lg hover:bg-expired-soft dark:hover:bg-expired-dark-soft transition-colors"
        >
          Leeren
        </button>
      )}
    </div>
  )
}
