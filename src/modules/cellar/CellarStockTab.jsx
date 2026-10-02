import { ListGroup, ListRow, IconTile } from '../../ui/List'
import Icon from '../../ui/Icon'
import { windowInfo, toneText, WineThumb, CheckCircle, EmptyState, ChipRow, RackGrid } from './cellarUi'

// Eine Weinzeile: Name · „Weingut · Jahrgang · Rebsorte“ · rechts Trinkfenster + Anzahl
export function WineRow({ bottle, rack, subtitle, selectMode, selected, onClick }) {
  const w = windowInfo(bottle, rack)
  return (
    <ListRow onClick={onClick}
      leading={selectMode ? <CheckCircle on={selected} /> : <WineThumb bottle={bottle} />}
      title={bottle.name}
      subtitle={subtitle ?? [bottle.winery, bottle.vintage, bottle.grape].filter(Boolean).join(' · ')}
      trailing={
        <div className="flex flex-col items-end gap-0.5 flex-none">
          {w.text && <span className={`text-footnote whitespace-nowrap ${toneText(w.tone)}`}>{w.text}</span>}
          <span className="text-footnote text-gray-500 dark:text-gray-400 flex items-center gap-1">
            {bottle.restock && <Icon name="cart" size={14} title="Wird nachgekauft" />}
            {bottle.count}×
          </span>
        </div>
      } />
  )
}

export default function CellarStockTab({
  mode, bottles, racks, filtered, groups, pendingCount, onOpenPending,
  showGrid, gridRacks, activeRack, onRackChange, selectMode, selected, onRow, onCell,
  onAdd, onImport, hasFilters, onResetFilters,
}) {
  const totalBottles = bottles.reduce((s, b) => s + Math.max(0, b.count), 0)
  const gridRack = gridRacks.find(r => r.id === activeRack?.id) || gridRacks[0]
  const rackOf = b => racks.find(r => r.id === b.rackId)

  return (
    <>
      {pendingCount > 0 && !selectMode && (
        <ListGroup>
          <ListRow onClick={onOpenPending} leading={<IconTile icon="inbox" tone="pantry" />} chevron
            title={`${pendingCount} ${pendingCount === 1 ? 'Wein wartet' : 'Weine warten'} aufs Einräumen`}
            subtitle="Regal und Platz zuweisen" />
        </ListGroup>
      )}

      {showGrid && gridRack && (
        <section className="px-4 space-y-2.5">
          {gridRacks.length > 1 && (
            <ChipRow value={gridRack.id} onChange={onRackChange}
              items={gridRacks.map(r => ({ id: r.id, label: `${r.emoji} ${r.label}`, count: bottles.filter(b => b.rackId === r.id).reduce((s, b) => s + b.count, 0) }))} />
          )}
          <div className="bg-white dark:bg-gray-800 rounded-card p-3">
            <RackGrid rack={gridRack} bottles={bottles} onCell={(row, col, first) => onCell(gridRack, row, col, first)} />
          </div>
          <p className="px-4 text-footnote text-gray-500 dark:text-gray-400">Tippe auf einen freien Platz, um dort eine Flasche einzulagern.</p>
        </section>
      )}

      {bottles.length === 0 ? (
        <EmptyState title="Noch keine Flaschen" text="Lege deine erste Flasche an – per Etikett-Foto geht es am schnellsten."
          action={
            <div className="flex flex-col items-center gap-1 mt-2">
              <button onClick={onAdd} className="btn-primary px-6"><Icon name="plus" size={20} />Flasche hinzufügen</button>
              <button onClick={onImport} className="min-h-[44px] px-4 text-callout font-semibold text-primary-500 dark:text-primary-300">Aus Excel importieren</button>
            </div>
          } />
      ) : filtered.length === 0 ? (
        mode === 'ablauf' && !hasFilters
          ? <EmptyState icon="clock" title="Gerade nichts trinkreif" text="Sobald eine Flasche ihr Trinkfenster erreicht, erscheint sie hier." />
          : <EmptyState icon="search" title="Nichts gefunden" text="Passe Suche oder Filter an."
              action={hasFilters && <button onClick={onResetFilters} className="min-h-[44px] px-4 text-callout font-semibold text-primary-500 dark:text-primary-300">Filter zurücksetzen</button>} />
      ) : mode === 'ablauf' ? (
        <ListGroup title="Jetzt trinkreif" footer="Zuerst oben: Flaschen, deren Trinkfenster am frühesten endet – Lagerbedingungen sind eingerechnet.">
          {filtered.map(b => (
            <WineRow key={b.id} bottle={b} rack={rackOf(b)} selectMode={selectMode} selected={selected.has(b.id)} onClick={() => onRow(b.id)} />
          ))}
        </ListGroup>
      ) : (
        <>
          {groups.map(g => (
            <ListGroup key={g.id} title={g.title}>
              {g.items.map(b => (
                <WineRow key={b.id} bottle={b} rack={g.rack} selectMode={selectMode} selected={selected.has(b.id)} onClick={() => onRow(b.id)} />
              ))}
            </ListGroup>
          ))}
          <p className="px-8 text-footnote text-center text-gray-500 dark:text-gray-400">
            {filtered.length} {filtered.length === 1 ? 'Wein' : 'Weine'} · {totalBottles} {totalBottles === 1 ? 'Flasche' : 'Flaschen'} · {racks.length} Lager
          </p>
        </>
      )}
    </>
  )
}
