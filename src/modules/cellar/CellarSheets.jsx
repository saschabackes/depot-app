import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow, IconTile } from '../../ui/List'
import { Segmented } from '../../ui/Controls'
import { Chip } from './wineConstants'

export const SWEETNESS_OPTIONS = [
  { id: 'trocken', label: 'Trocken' },
  { id: 'halbtrocken', label: 'Halbtrocken' },
  { id: 'lieblich', label: 'Lieblich' },
  { id: 'süß', label: 'Süß' },
  { id: 'brut', label: 'Brut' },
  { id: 'extra brut', label: 'Extra Brut' },
]

function Option({ label, on, onClick }) {
  return (
    <ListRow title={<span className="font-normal">{label}</span>} onClick={onClick}
      trailing={on ? <Icon name="check" size={20} strokeWidth={2.4} className="text-primary-500 dark:text-primary-300" /> : null} />
  )
}

export function CellarFilterSheet({
  onClose, sort, setSort, sortDir, setSortDir, alcohol, setAlcohol, sweetness, setSweetness,
  vintage, setVintage, country, setCountry, options, onReset, onSelectMode, showSort = true,
}) {
  return (
    <Sheet title="Filtern & sortieren" onClose={onClose} cancelLabel="Schließen" confirmLabel="Fertig" onConfirm={onClose}>
      <div className="space-y-5">
        {showSort && (
          <section className="px-4 space-y-2">
            <h2 className="px-4 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sortierung</h2>
            <Segmented label="Sortieren nach" value={sort} onChange={setSort}
              options={[{ id: 'name', label: 'A–Z' }, { id: 'vintage', label: 'Jahrgang' }, { id: 'price', label: 'Preis' }, { id: 'rack', label: 'Platz' }]} />
            <Segmented label="Reihenfolge" value={sortDir} onChange={setSortDir}
              options={[{ id: 'asc', label: 'Aufsteigend' }, { id: 'desc', label: 'Absteigend' }]} />
          </section>
        )}

        <section className="px-4 space-y-2">
          <h2 className="px-4 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Alkohol</h2>
          <Segmented label="Alkohol" value={alcohol} onChange={setAlcohol}
            options={[{ id: 'all', label: 'Alle' }, { id: 'alc', label: 'Mit Alkohol' }, { id: 'free', label: 'Alkoholfrei' }]} />
        </section>

        {options.sweetness.length > 0 && (
          <ListGroup title="Geschmack">
            <Option label="Alle" on={sweetness === 'all'} onClick={() => setSweetness('all')} />
            {options.sweetness.map(s => <Option key={s.id} label={s.label} on={sweetness === s.id} onClick={() => setSweetness(s.id)} />)}
          </ListGroup>
        )}

        {options.vintages.length > 0 && (
          <section className="px-4">
            <h2 className="px-4 pb-1.5 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Jahrgang</h2>
            <div className="bg-white dark:bg-gray-800 rounded-card p-3 flex flex-wrap gap-1.5">
              <Chip on={vintage === 'all'} onClick={() => setVintage('all')}>Alle</Chip>
              {options.vintages.map(v => (
                <Chip key={v} on={vintage === String(v)} onClick={() => setVintage(vintage === String(v) ? 'all' : String(v))}>{v}</Chip>
              ))}
            </div>
          </section>
        )}

        {options.countries.length > 0 && (
          <ListGroup title="Land">
            <Option label="Alle" on={country === 'all'} onClick={() => setCountry('all')} />
            {options.countries.map(c => <Option key={c} label={c} on={country === c} onClick={() => setCountry(c)} />)}
          </ListGroup>
        )}

        <ListGroup>
          <ListRow onClick={onReset} tone="accent" title="Alle Filter zurücksetzen" />
          <ListRow onClick={onSelectMode} tone="accent" title="Mehrere auswählen …" />
        </ListGroup>
      </div>
    </Sheet>
  )
}

export function CellarActionsSheet({ onClose, bottles, racks, pendingCount, onPending, onShare, onImport, onSettings, onSelectMode }) {
  const total = bottles.reduce((s, b) => s + Math.max(0, b.count), 0)
  const positions = bottles.filter(b => b.count > 0).length
  return (
    <Sheet title="Weinkeller" onClose={onClose} cancelLabel="Schließen">
      <div className="space-y-5">
        <p className="px-8 text-callout text-center text-gray-500 dark:text-gray-400">
          {positions} {positions === 1 ? 'Wein' : 'Weine'} · {total} {total === 1 ? 'Flasche' : 'Flaschen'} · {racks.length} Lager
        </p>
        {pendingCount > 0 && (
          <ListGroup>
            <ListRow onClick={onPending} leading={<IconTile icon="inbox" tone="pantry" />} chevron
              title="Weine einräumen" trailing={<span className="text-callout text-gray-500 dark:text-gray-400">{pendingCount}</span>} />
          </ListGroup>
        )}
        <ListGroup>
          <ListRow onClick={onShare} leading={<IconTile icon="share" />} chevron title="Weine empfehlen" subtitle="Link für Freunde – ohne Konto ansehbar" />
          <ListRow onClick={onImport} leading={<IconTile icon="list" />} chevron title="Aus Excel importieren" subtitle=".xlsx oder .csv" />
          <ListRow onClick={onSettings} leading={<IconTile icon="settings" tone="gray" />} chevron title="Lager & Sensoren verwalten" />
        </ListGroup>
        <ListGroup>
          <ListRow onClick={onSelectMode} tone="accent" title="Mehrere auswählen …" />
        </ListGroup>
      </div>
    </Sheet>
  )
}
