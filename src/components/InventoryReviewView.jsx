import { useEffect, useState } from 'react'
import useStore from '../store/useStore'
import Sheet from '../ui/Sheet'
import Icon from '../ui/Icon'
import { ListGroup, ListRow } from '../ui/List'
import { showToast } from '../ui/feedback'

export default function InventoryReviewView({ onClose, onNewPackage }) {
  const { pendingInventory, spices, updateFillLevel, resolvePending,
          loadPendingInventory, loadBringItems, bringSettings } = useStore()
  const [checking, setChecking] = useState(false)
  const ready = pendingInventory.filter(p => p.status === 'ready')

  // Beim Öffnen aktiv abgleichen: DB neu laden + Bring!-Abgleich anstoßen
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setChecking(true)
      await loadPendingInventory()
      if (bringSettings?.listUuid) await loadBringItems()
      if (!cancelled) setChecking(false)
    })()
    return () => { cancelled = true }
  }, [])

  // passende Gläser im Bestand (gleicher Name)
  function matchingJars(name) {
    const n = name.toLowerCase().trim()
    return spices.filter(s => !s.disposedAt && s.name.toLowerCase().trim() === n)
  }

  function refillExisting(item) {
    const jars = matchingJars(item.name)
    if (jars.length === 0) return
    // leerstes Glas auf voll setzen
    const emptiest = [...jars].sort((a, b) => (a.fillLevel ?? 4) - (b.fillLevel ?? 4))[0]
    updateFillLevel(emptiest.id, 4)
    resolvePending(item.id)
    showToast(`„${item.name}“ aufgefüllt.`)
  }

  return (
    <Sheet title="Einräumen" onClose={onClose} cancelLabel="Schließen">
      {ready.length === 0 ? (
        <div className="flex flex-col items-center text-center px-8 py-14 gap-3">
          <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center">
            {checking
              ? <Icon name="clock" size={30} className="animate-pulse" />
              : <Icon name="check" size={30} strokeWidth={2.2} />}
          </span>
          <h3 className="text-headline text-gray-900 dark:text-gray-100">{checking ? 'Wird abgeglichen …' : 'Alles eingeräumt'}</h3>
          <p className="text-callout text-gray-500 dark:text-gray-400">
            {checking
              ? 'Die Einkaufsliste wird gerade mit deinem Bestand abgeglichen.'
              : 'Hier landen eingekaufte Gewürze, die noch in den Bestand müssen – sobald du sie auf der Einkaufsliste abhakst.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="px-6 text-callout text-gray-500 dark:text-gray-400">
            Diese Gewürze wurden auf der Einkaufsliste abgehakt. Eingekauft? Dann einräumen.
          </p>
          {ready.map(item => {
            const jars = matchingJars(item.name)
            const exists = jars.length > 0
            return (
              <ListGroup key={item.id}>
                <ListRow title={item.name}
                  subtitle={[item.brand, exists ? `${jars.length} ${jars.length === 1 ? 'Glas' : 'Gläser'} im Bestand` : 'Noch nicht im Bestand'].filter(Boolean).join(' · ')}
                  trailing={
                    <button onClick={() => resolvePending(item.id)}
                      className="flex-none min-h-[44px] -mr-2 px-2 text-footnote font-semibold text-gray-500 dark:text-gray-400">
                      Nicht gekauft
                    </button>
                  } />
                <div className="p-3">
                  {exists ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => refillExisting(item)} className="btn-primary w-full">Auffüllen</button>
                      <button onClick={() => onNewPackage(item)} className="btn-secondary w-full">
                        <Icon name="plus" size={20} />Neue Packung
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => onNewPackage(item)} className="btn-primary w-full">
                      <Icon name="plus" size={20} />Als neues Gewürz anlegen
                    </button>
                  )}
                </div>
              </ListGroup>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}
