import { useState, useMemo, useCallback, useEffect } from 'react'
import useStore from '../store/useStore'
import { useFreezer } from '../modules/freezer/store'
import { useCellar } from '../modules/cellar/store'
import { computeRecipeAvailability } from '../utils/inventoryMatch'
import RecipeForm from './RecipeForm'
import RecipeDetail, { AvailBar } from './RecipeDetail'
import Screen, { BarButton } from '../ui/Screen'
import Sheet from '../ui/Sheet'
import Icon from '../ui/Icon'
import { ListGroup, ListRow } from '../ui/List'
import { SearchField, Segmented } from '../ui/Controls'

const SORT_OPTIONS = [
  { id: 'newest',  label: 'Neueste' },
  { id: 'alpha',   label: 'A–Z' },
  { id: 'avail',   label: 'Verfügbarkeit' },
]

const SOURCE_LABELS = { youtube: 'YouTube', cookidoo: 'Cookidoo', kptncook: 'KptnCook', web: 'Web', manual: 'Manuell' }

export default function RecipesView({ focusId = null, onFocusHandled = () => {} }) {
  const recipes = useStore(s => s.recipes)
  const toggleFavorite = useStore(s => s.toggleFavorite)
  const spices = useStore(s => s.spices)
  const freezerItems = useFreezer(s => s.items)
  const bottles = useCellar(s => s.bottles)

  const [mode, setMode]       = useState('list')
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch]   = useState('')
  const [activeFilters, setActiveFilters] = useState({
    tag: null,
    source: null,
    favorite: false,
    available: false,
  })
  const [sortBy, setSortBy]   = useState('newest')
  const [showFilters, setShowFilters] = useState(false)

  const selected = recipes.find(r => r.id === selectedId)

  useEffect(() => {
    if (!focusId) return
    if (recipes.some(r => r.id === focusId)) {
      setSelectedId(focusId)
      setMode('detail')
    }
    onFocusHandled()
  }, [focusId])

  // Availability map
  const availMap = useMemo(() => {
    const map = {}
    recipes.forEach(r => {
      if (!r.ingredients?.length) { map[r.id] = null; return }
      map[r.id] = computeRecipeAvailability(r, spices, freezerItems, bottles)
    })
    return map
  }, [recipes, spices, freezerItems, bottles])

  // All unique tags
  const allTags = useMemo(() => {
    const s = new Set()
    recipes.forEach(r => (r.tags ?? []).forEach(t => s.add(t)))
    return [...s].sort((a, b) => a.localeCompare(b, 'de'))
  }, [recipes])

  // All unique sources
  const allSources = useMemo(() => {
    const s = new Set()
    recipes.forEach(r => s.add(r.sourceType || 'manual'))
    return [...s].sort()
  }, [recipes])

  // Filter + Sort
  const filtered = useMemo(() => {
    let list = recipes
    const { tag, source, favorite, available } = activeFilters

    if (favorite) list = list.filter(r => r.favorite)
    if (tag) list = list.filter(r => (r.tags ?? []).includes(tag))
    if (source) list = list.filter(r => (r.sourceType || 'manual') === source)
    if (available) list = list.filter(r => {
      const a = availMap[r.id]
      return a && a.percentage >= 0.5
    })

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.author ?? '').toLowerCase().includes(q) ||
        (r.tags ?? []).some(t => t.toLowerCase().includes(q))
      )
    }

    const sorted = [...list]
    if (sortBy === 'alpha') sorted.sort((a, b) => a.title.localeCompare(b.title, 'de'))
    else if (sortBy === 'avail') sorted.sort((a, b) => (availMap[b.id]?.percentage ?? -1) - (availMap[a.id]?.percentage ?? -1))
    else sorted.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

    return sorted
  }, [recipes, search, activeFilters, sortBy, availMap])

  const activeCount = (activeFilters.tag ? 1 : 0) + (activeFilters.source ? 1 : 0) + (activeFilters.favorite ? 1 : 0) + (activeFilters.available ? 1 : 0)

  const setFilter = useCallback((key, value) => {
    setActiveFilters(f => ({ ...f, [key]: value }))
  }, [])

  const openNew = () => { setEditing(null); setShowForm(true) }
  const resetFilters = () => setActiveFilters({ tag: null, source: null, favorite: false, available: false })
  const sheetFilters = (activeFilters.tag ? 1 : 0) + (activeFilters.source ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0)

  const form = showForm && (
    <RecipeForm
      recipe={editing}
      onClose={() => setShowForm(false)}
      onSaved={(id) => { setSelectedId(id); setMode('detail') }}
    />
  )

  // ── Detail ──
  if (mode === 'detail' && selected) {
    return (
      <>
        <RecipeDetail
          key={selected.id}
          recipe={selected}
          onBack={() => setMode('list')}
          onEdit={(r) => { setEditing(r); setShowForm(true) }}
        />
        {form}
      </>
    )
  }

  const quick = [
    { id: 'all', label: 'Alle', on: !activeFilters.favorite && !activeFilters.available, onClick: () => setActiveFilters(f => ({ ...f, favorite: false, available: false })) },
    { id: 'fav', label: 'Favoriten', on: activeFilters.favorite, onClick: () => setFilter('favorite', !activeFilters.favorite) },
    { id: 'avail', label: 'Kann ich kochen', on: activeFilters.available, onClick: () => setFilter('available', !activeFilters.available) },
  ]

  return (
    <Screen title="Kochen" actions={<BarButton icon="plus" label="Rezept hinzufügen" onClick={openNew} />}>
      {recipes.length > 0 && (
        <div className="px-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SearchField value={search} onChange={setSearch} placeholder="Rezepte durchsuchen" />
            </div>
            <button onClick={() => setShowFilters(true)} aria-label="Filtern und sortieren"
              className="relative w-11 h-11 flex-none rounded-[10px] bg-gray-200/70 dark:bg-gray-700 text-primary-500 dark:text-primary-300 flex items-center justify-center">
              <Icon name="filter" size={22} strokeWidth={2.1} />
              {sheetFilters > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary-500 text-white text-[11px] font-bold leading-[18px] text-center">{sheetFilters}</span>}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {quick.map(f => (
              <button key={f.id} onClick={f.onClick} aria-pressed={f.on}
                className={`flex-none min-h-[34px] px-3.5 rounded-full text-[14px] font-semibold ${
                  f.on ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center px-8 py-14 gap-3">
            <span className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center">
              <Icon name={recipes.length === 0 ? 'pot' : 'search'} size={30} />
            </span>
            <h3 className="text-headline text-gray-900 dark:text-gray-100">{recipes.length === 0 ? 'Noch keine Rezepte' : 'Nichts gefunden'}</h3>
            <p className="text-callout text-gray-500 dark:text-gray-400">
              {recipes.length === 0
                ? 'Speichere Rezepte aus YouTube, Cookidoo oder dem Web – Depot prüft dann, was du schon im Bestand hast.'
                : 'Passe Suche oder Filter an.'}
            </p>
            {recipes.length === 0
              ? <button onClick={openNew} className="btn-primary px-6 mt-2"><Icon name="plus" size={20} />Rezept hinzufügen</button>
              : (activeCount > 0 || search) && <button onClick={() => { resetFilters(); setSearch('') }} className="min-h-[44px] px-4 text-callout font-semibold text-primary-500 dark:text-primary-300">Filter zurücksetzen</button>}
          </div>
        ) : (
          <>
            <p className="px-8 pb-1.5 text-footnote text-gray-500 dark:text-gray-400">
              {filtered.length === recipes.length ? `${recipes.length} ${recipes.length === 1 ? 'Rezept' : 'Rezepte'}` : `${filtered.length} von ${recipes.length} Rezepten`} · {SORT_OPTIONS.find(o => o.id === sortBy)?.label}
            </p>
            <div className="px-4 space-y-2.5">
              {filtered.map(r => (
                <RecipeCard key={r.id} recipe={r} avail={availMap[r.id]}
                  onOpen={() => { setSelectedId(r.id); setMode('detail') }}
                  onToggleFavorite={() => toggleFavorite(r.id)} />
              ))}
            </div>
          </>
        )}
      </div>

      {showFilters && (
        <FilterSheet onClose={() => setShowFilters(false)}
          filters={activeFilters} setFilter={setFilter} reset={() => { resetFilters(); setSortBy('newest') }}
          sortBy={sortBy} setSortBy={setSortBy} allTags={allTags} allSources={allSources} />
      )}

      {form}
    </Screen>
  )
}

function RecipeCard({ recipe: r, avail, onOpen, onToggleFavorite }) {
  const total = avail ? avail.totalFound + avail.totalMissing : 0
  const meta = [r.author, r.tags?.[0]].filter(Boolean).join(' · ')
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-card">
      <button onClick={onOpen} className="w-full flex items-center gap-3 p-2.5 pr-12 text-left rounded-card active:bg-gray-100 dark:active:bg-gray-700">
        <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-gray-100 dark:bg-gray-700 flex-none flex items-center justify-center text-gray-400">
          {r.thumbnailUrl
            ? <img src={r.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            : <Icon name="pot" size={28} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{r.title}</p>
          {meta && <p className="text-footnote text-gray-500 dark:text-gray-400 truncate">{meta}</p>}
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <AvailBar found={avail.totalFound} total={total} className="flex-1 max-w-[120px]" />
              <span className={`text-footnote font-semibold ${avail.totalMissing === 0 ? 'text-primary-500 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
                {avail.totalMissing === 0 ? 'Alles da' : `${avail.totalFound} von ${total} da`}
              </span>
            </div>
          )}
        </div>
      </button>
      <button onClick={onToggleFavorite} aria-label={r.favorite ? `${r.title} aus Favoriten entfernen` : `${r.title} als Favorit markieren`} aria-pressed={!!r.favorite}
        className={`absolute top-1 right-1 w-11 h-11 flex items-center justify-center rounded-full ${r.favorite ? 'text-soon dark:text-soon-dark' : 'text-gray-300 dark:text-gray-600'}`}>
        <Icon name="star" size={22} strokeWidth={2} filled={r.favorite} />
      </button>
    </div>
  )
}

function FilterSheet({ onClose, filters, setFilter, reset, sortBy, setSortBy, allTags, allSources }) {
  const Option = ({ label, on, onClick }) => (
    <ListRow title={<span className="font-normal">{label}</span>} onClick={onClick}
      trailing={on ? <Icon name="check" size={20} strokeWidth={2.4} className="text-primary-500 dark:text-primary-300" /> : null} />
  )
  const Toggle = ({ label, sub, on, onClick }) => (
    <ListRow title={<span className="font-normal">{label}</span>} subtitle={sub} onClick={onClick}
      trailing={
        <span className={`w-[51px] h-[31px] rounded-full p-0.5 flex-none transition-colors ${on ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'}`} aria-hidden="true">
          <span className={`block w-[27px] h-[27px] rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
        </span>
      } />
  )
  return (
    <Sheet title="Filtern & sortieren" onClose={onClose} cancelLabel="Schließen" confirmLabel="Fertig" onConfirm={onClose}>
      <div className="space-y-5">
        <div className="px-4">
          <Segmented label="Sortierung" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
        </div>
        <ListGroup>
          <Toggle label="Nur Favoriten" on={filters.favorite} onClick={() => setFilter('favorite', !filters.favorite)} />
          <Toggle label="Kann ich kochen" sub="Mindestens die Hälfte der Zutaten ist da" on={filters.available} onClick={() => setFilter('available', !filters.available)} />
        </ListGroup>
        {allSources.length > 1 && (
          <ListGroup title="Quelle">
            <Option label="Alle" on={!filters.source} onClick={() => setFilter('source', null)} />
            {allSources.map(s => <Option key={s} label={SOURCE_LABELS[s] || s} on={filters.source === s} onClick={() => setFilter('source', s)} />)}
          </ListGroup>
        )}
        {allTags.length > 0 && (
          <ListGroup title="Kategorie">
            <Option label="Alle" on={!filters.tag} onClick={() => setFilter('tag', null)} />
            {allTags.map(t => <Option key={t} label={t} on={filters.tag === t} onClick={() => setFilter('tag', t)} />)}
          </ListGroup>
        )}
        <ListGroup>
          <ListRow onClick={reset} tone="accent" title="Alle Filter zurücksetzen" />
        </ListGroup>
      </div>
    </Sheet>
  )
}
