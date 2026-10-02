import Sheet from './Sheet'
import { ListGroup, ListRow } from './List'

export const DISPOSAL_REASONS = [
  { id: 'schaedling',  label: 'Schädlingsbefall' },
  { id: 'abgelaufen',  label: 'Abgelaufen / verdorben' },
  { id: 'schimmel',    label: 'Schimmel' },
  { id: 'beschaedigt', label: 'Verpackung beschädigt' },
  { id: 'qualitaet',   label: 'Qualität schlecht' },
  { id: 'sonstiges',   label: 'Sonstiges' },
]

export const disposalLabel = id => DISPOSAL_REASONS.find(r => r.id === id)?.label ?? id

// Entsorgen mit Grund – gemeinsam für Gewürze, Vorrat usw.
export default function DisposeSheet({ name, onPick, onClose }) {
  return (
    <Sheet title="Entsorgen" onClose={onClose} z={70}>
      <p className="px-6 pb-3 text-callout text-gray-500 dark:text-gray-400">
        Warum wird „{name}“ entsorgt? Der Eintrag bleibt im Verlauf „Entsorgt“ sichtbar.
      </p>
      <ListGroup>
        {DISPOSAL_REASONS.map(r => (
          <ListRow key={r.id} title={r.label} onClick={() => onPick(r.id)} chevron />
        ))}
      </ListGroup>
    </Sheet>
  )
}
