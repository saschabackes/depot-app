import { ListGroup, ListRow, IconTile } from '../../ui/List'
import { StatusPill } from '../../ui/Controls'
import Icon from '../../ui/Icon'
import { WineRow } from './CellarStockTab'
import { quality, positionLabel, EmptyState, ChipRow, RackGrid } from './cellarUi'

// Lager-Ansicht: ein Regal mit Sensorwerten, Lagerqualität, Gitter und Inhalt
export default function CellarRackTab({ racks, bottles, activeRack, onRackChange, reading, onOpen, onCell, onAdd, onSettings }) {
  if (!racks.length || !activeRack) {
    return (
      <EmptyState icon="boxes" title="Noch kein Lager" text="Lege ein Regal, einen Keller oder einen Weinkühlschrank an."
        action={<button onClick={onSettings} className="btn-primary px-6 mt-2"><Icon name="plus" size={20} />Lager anlegen</button>} />
    )
  }

  const inRack = bottles.filter(b => b.rackId === activeRack.id && b.count > 0)
    .sort((a, b) => ((a.row || 0) * 1000 + (a.col || 0)) - ((b.row || 0) * 1000 + (b.col || 0)) || (a.slot || '').localeCompare(b.slot || '', 'de'))
  const total = inRack.reduce((s, b) => s + b.count, 0)
  const isGrid = activeRack.rows > 0 && activeRack.cols > 0
  const q = quality(activeRack.conditions)
  const hasReading = reading && (reading.temperature != null || reading.humidity != null)

  return (
    <>
      {racks.length > 1 && (
        <div className="px-4 -mt-1">
          <ChipRow value={activeRack.id} onChange={onRackChange}
            items={racks.map(r => ({ id: r.id, label: `${r.emoji} ${r.label}`, count: bottles.filter(b => b.rackId === r.id).reduce((s, b) => s + Math.max(0, b.count), 0) }))} />
        </div>
      )}

      <ListGroup title={racks.length > 1 ? null : `${activeRack.emoji} ${activeRack.label}`}>
        {hasReading && (
          <ListRow
            leading={<IconTile icon="snow" tone={reading.online ? 'freezer' : 'gray'} />}
            title={[reading.temperature != null && `${reading.temperature.toFixed(1)} °C`, reading.humidity != null && `${reading.humidity.toFixed(0)} % Feuchte`].filter(Boolean).join(' · ')}
            subtitle={reading.online ? 'Live vom Sensor' : 'Sensor offline – letzter Wert'}
            trailing={<span className={`w-2.5 h-2.5 rounded-full flex-none ${reading.online ? 'bg-primary-500 dark:bg-primary-300' : 'bg-gray-300 dark:bg-gray-600'}`} aria-hidden="true" />} />
        )}
        <ListRow leading={<IconTile icon="leaf" tone="cellar" />} title="Lagerqualität"
          subtitle={q.score >= 85 ? 'Volles Trinkfenster' : 'Verkürzt das Trinkfenster etwas'}
          trailing={<StatusPill tone={q.tone}>{q.score}/100 · {q.label}</StatusPill>} />
        <ListRow onClick={onSettings} leading={<IconTile icon="settings" tone="gray" />} chevron
          title="Lager bearbeiten" subtitle="Plätze, Bedingungen, Sensor" />
      </ListGroup>

      {isGrid && (
        <section className="px-4 space-y-1.5">
          <div className="bg-white dark:bg-gray-800 rounded-card p-3">
            <RackGrid rack={activeRack} bottles={bottles} onCell={onCell} />
          </div>
          <p className="px-4 text-footnote text-gray-500 dark:text-gray-400">Tippe auf einen freien Platz, um dort eine Flasche einzulagern.</p>
        </section>
      )}

      {inRack.length === 0 ? (
        <EmptyState icon="wine" title="Lager ist leer" text="Lagere hier deine erste Flasche ein."
          action={<button onClick={onAdd} className="btn-primary px-6 mt-2"><Icon name="plus" size={20} />Flasche einlagern</button>} />
      ) : (
        <ListGroup title={`Inhalt · ${total} ${total === 1 ? 'Flasche' : 'Flaschen'}`}>
          {inRack.map(b => (
            <WineRow key={b.id} bottle={b} rack={activeRack} onClick={() => onOpen(b.id)}
              subtitle={[positionLabel(b), b.winery, b.vintage].filter(Boolean).join(' · ')} />
          ))}
        </ListGroup>
      )}
    </>
  )
}
