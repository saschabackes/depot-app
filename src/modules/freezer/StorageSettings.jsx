import { useState } from 'react'
import { useFreezer } from './store'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow, IconTile } from '../../ui/List'
import { confirmAction } from '../../ui/feedback'

export const EMOJI_OPTIONS = ['🏠','🔻','❄️','🧊','📦','🏚️','🏬','🚪']

// Ein Gefrierschrank mit seinen Fächern (auch im Einrichtungsassistenten genutzt)
export function StorageEditor({ storage: s, index, count, onMove }) {
  const { items, renameStorage, removeStorage, addCompartment, renameCompartment, removeCompartment } = useFreezer()
  const countIn = compId => items.filter(it => it.storageId === s.id && (!compId || it.compartmentId === compId)).length

  async function deleteStorage() {
    const n = countIn()
    if (await confirmAction({
      title: `„${s.label}“ löschen?`,
      message: n ? `Auch ${n} ${n === 1 ? 'Eintrag' : 'Einträge'} darin werden gelöscht.` : 'Der Gefrierschrank ist leer.',
      confirmLabel: 'Löschen', destructive: true,
    })) removeStorage(s.id)
  }

  async function deleteCompartment(c) {
    const n = countIn(c.id)
    if (await confirmAction({
      title: `Fach „${c.label}“ löschen?`,
      message: n ? `Auch ${n} ${n === 1 ? 'Eintrag' : 'Einträge'} darin werden gelöscht.` : undefined,
      confirmLabel: 'Löschen', destructive: true,
    })) removeCompartment(s.id, c.id)
  }

  return (
    <ListGroup title={s.label || 'Gefrierschrank'}>
      <div className="flex items-center gap-2 px-4 py-1.5 min-h-[50px]">
        <select value={s.emoji} onChange={e => renameStorage(s.id, s.label, e.target.value)} aria-label="Symbol"
          className="flex-none w-11 h-11 rounded-[10px] bg-gray-100 dark:bg-gray-700 text-[20px] text-center appearance-none">
          {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
        </select>
        <input value={s.label} onChange={e => renameStorage(s.id, e.target.value, s.emoji)} aria-label="Name des Gefrierschranks"
          className="flex-1 min-w-0 bg-transparent outline-none text-body font-semibold text-gray-900 dark:text-gray-100 py-2" />
        {onMove && count > 1 && (
          <>
            <button onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="Nach oben"
              className="w-11 h-11 flex-none flex items-center justify-center text-primary-500 dark:text-primary-300 disabled:opacity-30">
              <Icon name="chevron" size={18} strokeWidth={2.2} className="-rotate-90" />
            </button>
            <button onClick={() => onMove(index, 1)} disabled={index === count - 1} aria-label="Nach unten"
              className="w-11 h-11 -mr-2 flex-none flex items-center justify-center text-primary-500 dark:text-primary-300 disabled:opacity-30">
              <Icon name="chevron" size={18} strokeWidth={2.2} className="rotate-90" />
            </button>
          </>
        )}
      </div>
      {s.compartments.map(c => (
        <div key={c.id} className="flex items-center gap-2 pl-6 pr-2 min-h-[48px]">
          <input value={c.label} onChange={e => renameCompartment(s.id, c.id, e.target.value)} aria-label="Name des Fachs"
            className="flex-1 min-w-0 bg-transparent outline-none text-body text-gray-900 dark:text-gray-100 py-2" />
          <span className="text-footnote text-gray-500 dark:text-gray-400">{countIn(c.id) || ''}</span>
          <button onClick={() => deleteCompartment(c)} aria-label={`Fach ${c.label} löschen`}
            className="w-11 h-11 flex-none flex items-center justify-center text-gray-400">
            <Icon name="trash" size={19} />
          </button>
        </div>
      ))}
      <ListRow onClick={() => addCompartment(s.id, `Fach ${s.compartments.length + 1}`)} tone="accent"
        leading={<Icon name="plus" size={20} strokeWidth={2.2} className="text-primary-500 dark:text-primary-300" />} title="Fach hinzufügen" />
      <ListRow onClick={deleteStorage} tone="danger" title="Gefrierschrank löschen" />
    </ListGroup>
  )
}

export function NewStorageRow() {
  const addStorage = useFreezer(s => s.addStorage)
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('📦')

  function add() {
    const l = label.trim()
    if (!l) return
    addStorage(l, emoji)
    setLabel(''); setEmoji('📦')
  }

  return (
    <ListGroup title="Neuer Gefrierschrank">
      <div className="flex items-center gap-2 px-4 py-1.5 min-h-[50px]">
        <select value={emoji} onChange={e => setEmoji(e.target.value)} aria-label="Symbol"
          className="flex-none w-11 h-11 rounded-[10px] bg-gray-100 dark:bg-gray-700 text-[20px] text-center appearance-none">
          {EMOJI_OPTIONS.map(e => <option key={e}>{e}</option>)}
        </select>
        <input value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }}
          placeholder="z. B. TK Garage" aria-label="Name des neuen Gefrierschranks"
          className="flex-1 min-w-0 bg-transparent outline-none text-body text-gray-900 dark:text-gray-100 placeholder:text-gray-400 py-2" />
        <button onClick={add} disabled={!label.trim()}
          className="min-h-[44px] px-2 -mr-2 text-body font-semibold text-primary-500 dark:text-primary-300 disabled:opacity-40">Anlegen</button>
      </div>
    </ListGroup>
  )
}

export default function StorageSettings({ onClose, onImport }) {
  const { storages, reorderStorages, restartSetup } = useFreezer()

  function move(idx, dir) {
    const next = [...storages]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    reorderStorages(next)
  }

  return (
    <Sheet title="Gefrierschränke" onClose={onClose} cancelLabel="Schließen" confirmLabel="Fertig" onConfirm={onClose}>
      <div className="space-y-5">
        {storages.map((s, idx) => (
          <StorageEditor key={s.id} storage={s} index={idx} count={storages.length} onMove={move} />
        ))}
        <NewStorageRow />
        <ListGroup title="Weitere">
          {onImport && (
            <ListRow onClick={onImport} leading={<IconTile icon="inbox" tone="freezer" size={30} />} title="Aus Excel importieren …" chevron />
          )}
          <ListRow onClick={() => { onClose(); restartSetup() }} leading={<IconTile icon="help" tone="gray" size={30} />} title="Einrichtung erneut starten" chevron />
        </ListGroup>
      </div>
    </Sheet>
  )
}
