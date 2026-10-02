import { useState, useCallback, useMemo } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import useDashboardData from './useDashboardData'
import useStore from '../../store/useStore'
import { useFreezer } from '../freezer/store'
import { useCellar } from '../cellar/store'
import { usePantry } from '../pantry/store'
import { APP_NAME } from '../../branding'
import Screen from '../../ui/Screen'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow, IconTile } from '../../ui/List'
import { SearchField, StatusPill } from '../../ui/Controls'

const TYPE_META = {
  spice:   { icon: 'leaf',   tone: 'spices',  section: 'spices',  label: 'Gewürze' },
  freezer: { icon: 'snow',   tone: 'freezer', section: 'freezer', label: 'Tiefkühl' },
  cellar:  { icon: 'wine',   tone: 'cellar',  section: 'cellar',  label: 'Wein' },
  pantry:  { icon: 'pantry', tone: 'pantry',  section: 'pantry',  label: 'Vorrat' },
  recipe:  { icon: 'pot',    tone: 'accent',  section: 'recipes', label: 'Rezept' },
}

const TILES = [
  { type: 'spice',   key: 'spices',  unit: n => (n === 1 ? 'Gewürz' : 'Gewürze') },
  { type: 'freezer', key: 'freezer', unit: () => 'Tiefkühl' },
  { type: 'cellar',  key: 'cellar',  unit: n => (n === 1 ? 'Flasche Wein' : 'Flaschen Wein') },
  { type: 'pantry',  key: 'pantry',  unit: () => 'Vorrat' },
]

const ALL_SECTIONS = [
  { id: 'attention', label: 'Braucht Aufmerksamkeit' },
  { id: 'counts',    label: 'Bestand' },
  { id: 'cooking',   label: 'Heute kochen' },
  { id: 'dailyfact', label: 'Wusstest du?' },
  { id: 'activity',  label: 'Letzte Aktivität' },
]

const STORAGE_KEY = 'depot_dashboard_config_v2'

function getConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.order && saved?.visible) return saved
  } catch { /* Standard verwenden */ }
  return { order: ALL_SECTIONS.map(s => s.id), visible: Object.fromEntries(ALL_SECTIONS.map(s => [s.id, true])) }
}

function initials(user) {
  const name = user?.user_metadata?.name ?? user?.email ?? ''
  return name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?'
}

export default function DashboardView({ onNavigate, onOpenProfile }) {
  const data = useDashboardData()
  const user = useStore(s => s.user)
  const [config, setConfig] = useState(getConfig)
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')

  const updateConfig = useCallback(fn => {
    setConfig(prev => {
      const next = fn(prev)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
  const sections = config.order.map(id => ALL_SECTIONS.find(s => s.id === id)).filter(Boolean)

  return (
    <Screen
      eyebrow={today}
      title={APP_NAME}
      actions={
        <button onClick={onOpenProfile} aria-label="Profil und Einstellungen"
          className="w-11 h-11 rounded-full flex items-center justify-center">
          <span className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900 text-primary-500 dark:text-primary-200 text-[14px] font-bold flex items-center justify-center">
            {initials(user)}
          </span>
        </button>
      }
    >
      <div className="px-4 pb-4">
        <SearchField value={query} onChange={setQuery} placeholder="Überall suchen" label="In allen Bereichen suchen" />
      </div>

      {query.trim() ? (
        <GlobalSearchResults query={query.trim()} onNavigate={onNavigate} />
      ) : editing ? (
        <EditSections sections={sections} config={config} updateConfig={updateConfig} onDone={() => setEditing(false)} />
      ) : (
        <div className="space-y-6">
          {sections.map(s => {
            if (!config.visible[s.id]) return null
            switch (s.id) {
              case 'attention': return <AttentionSection key={s.id} items={data.attention} onNavigate={onNavigate} />
              case 'counts':    return <CountsSection key={s.id} counts={data.counts} onNavigate={onNavigate} />
              case 'cooking':   return <CookingSection key={s.id} suggestions={data.suggestions} counts={data.counts} onNavigate={onNavigate} />
              case 'dailyfact': return <DailyFactSection key={s.id} fact={data.dailyFact} />
              case 'activity':  return data.recentActivity.length > 0 ? <ActivitySection key={s.id} items={data.recentActivity} /> : null
              default: return null
            }
          })}
          <div className="flex justify-center">
            <button onClick={() => setEditing(true)} className="min-h-[44px] px-4 text-callout font-semibold text-primary-500 dark:text-primary-300">
              Startseite anpassen
            </button>
          </div>
        </div>
      )}
    </Screen>
  )
}

function SectionTitle({ children, action }) {
  return (
    <div className="flex items-baseline justify-between px-5 pb-2">
      <h2 className="text-headline text-gray-900 dark:text-gray-100">{children}</h2>
      {action}
    </div>
  )
}

function AttentionSection({ items, onNavigate }) {
  if (items.length === 0) {
    return (
      <section>
        <SectionTitle>Braucht Aufmerksamkeit</SectionTitle>
        <ListGroup>
          <ListRow leading={<IconTile icon="check" tone="accent" />} title="Alles im grünen Bereich" subtitle="Nichts läuft ab, nichts ist leer." />
        </ListGroup>
      </section>
    )
  }
  return (
    <section>
      <SectionTitle>Braucht Aufmerksamkeit</SectionTitle>
      <ListGroup>
        {items.slice(0, 5).map(item => {
          const meta = TYPE_META[item.type]
          return (
            <ListRow key={`${item.type}-${item.id}`}
              onClick={() => onNavigate(meta.section, item.id)}
              leading={<IconTile icon={meta.icon} tone={meta.tone} />}
              title={item.name}
              subtitle={meta.label}
              trailing={<StatusPill tone={item.status === 'expired' ? 'expired' : 'soon'}>{item.label}</StatusPill>}
            />
          )
        })}
      </ListGroup>
    </section>
  )
}

function CountsSection({ counts, onNavigate }) {
  return (
    <section>
      <SectionTitle>Bestand</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5 px-4">
        {TILES.map(t => {
          const meta = TYPE_META[t.type]
          const n = counts[t.key] ?? 0
          return (
            <button key={t.type} onClick={() => onNavigate(meta.section)}
              className="bg-white dark:bg-gray-800 rounded-card p-3.5 text-left flex flex-col gap-2.5 active:bg-gray-100 dark:active:bg-gray-700">
              <IconTile icon={meta.icon} tone={meta.tone} size={32} />
              <div>
                <div className="text-[26px] leading-8 font-bold tracking-tight text-gray-900 dark:text-gray-50">{n}</div>
                <div className="text-callout text-gray-500 dark:text-gray-400">{t.unit(n)}</div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function CookingSection({ suggestions, counts, onNavigate }) {
  if (suggestions.length === 0) {
    if (counts.recipes > 0) return null
    return (
      <section>
        <SectionTitle>Heute kochen</SectionTitle>
        <ListGroup>
          <ListRow onClick={() => onNavigate('recipes')} chevron leading={<IconTile icon="pot" />}
            title="Rezepte sammeln" subtitle="Dann schlägt Depot vor, was du mit deinem Bestand kochen kannst." />
        </ListGroup>
      </section>
    )
  }
  return (
    <section>
      <SectionTitle>Heute kochen</SectionTitle>
      <div className="space-y-2 px-4">
        {suggestions.slice(0, 3).map(s => {
          const total = s.totalFound + s.totalMissing
          return (
            <button key={s.recipe.id} onClick={() => onNavigate('recipes', s.recipe.id)}
              className="w-full bg-white dark:bg-gray-800 rounded-card p-2.5 flex items-center gap-3 text-left active:bg-gray-100 dark:active:bg-gray-700">
              {s.recipe.thumbnailUrl
                ? <img src={s.recipe.thumbnailUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-none" />
                : <IconTile icon="pot" size={64} />}
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-body font-semibold text-gray-900 dark:text-gray-100 truncate">{s.recipe.title}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full bg-primary-500 dark:bg-primary-300" style={{ width: `${total ? (s.totalFound / total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-footnote text-gray-500 dark:text-gray-400 flex-none">{s.totalFound} von {total} da</span>
                </div>
                {s.matchedExpiring > 0 && <StatusPill tone="soon">Verbraucht {s.matchedExpiring}× bald Ablaufendes</StatusPill>}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function DailyFactSection({ fact }) {
  if (!fact) return null
  return (
    <section>
      <SectionTitle>Wusstest du?</SectionTitle>
      <div className="mx-4 bg-white dark:bg-gray-800 rounded-card p-4 flex gap-3">
        <span className="text-primary-500 dark:text-primary-300 mt-0.5"><Icon name="sparkle" size={20} /></span>
        <p className="text-callout text-gray-700 dark:text-gray-200 leading-relaxed">{fact.text}</p>
      </div>
    </section>
  )
}

const ACTION_LABELS = {
  spice_added: 'hat hinzugefügt', spice_updated: 'hat aktualisiert', spice_deleted: 'hat gelöscht', spice_disposed: 'hat entsorgt',
  fill_changed: 'Füllstand geändert', shopping_added: 'auf die Einkaufsliste', shopping_checked: 'abgehakt', shopping_deleted: 'entfernt',
  freezer_added: 'eingefroren', freezer_removed: 'entnommen', cellar_added: 'eingelagert', cellar_removed: 'entnommen',
  wine_added: 'eingelagert', recipe_added: 'Rezept gespeichert', pantry_added: 'in den Vorrat',
}

function ActivitySection({ items }) {
  return (
    <section>
      <SectionTitle>Letzte Aktivität</SectionTitle>
      <ListGroup>
        {items.map(a => (
          <ListRow key={a.id} title={a.target || '—'}
            subtitle={`${a.userName} · ${ACTION_LABELS[a.action] ?? a.action}`}
            trailing={<span className="text-footnote text-gray-500 dark:text-gray-400 flex-none">{timeAgo(a.createdAt)}</span>} />
        ))}
      </ListGroup>
    </section>
  )
}

function timeAgo(dateStr) {
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: de }) } catch { return '' }
}

function EditSections({ sections, config, updateConfig, onDone }) {
  const move = (id, dir) => updateConfig(c => {
    const order = [...c.order]
    const i = order.indexOf(id), j = i + dir
    if (j < 0 || j >= order.length) return c
    ;[order[i], order[j]] = [order[j], order[i]]
    return { ...c, order }
  })
  return (
    <div className="space-y-4">
      <ListGroup title="Bereiche der Startseite" footer="Ein- und ausblenden, Reihenfolge mit den Pfeilen ändern.">
        {sections.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 px-4 min-h-[50px]">
            <label className="flex-1 flex items-center gap-3 min-h-[44px]">
              <input type="checkbox" checked={!!config.visible[s.id]}
                onChange={() => updateConfig(c => ({ ...c, visible: { ...c.visible, [s.id]: !c.visible[s.id] } }))}
                className="w-5 h-5 accent-primary-500" />
              <span className="text-body text-gray-900 dark:text-gray-100">{s.label}</span>
            </label>
            <button onClick={() => move(s.id, -1)} disabled={i === 0} aria-label={`${s.label} nach oben`}
              className="w-11 h-11 flex items-center justify-center text-gray-500 disabled:opacity-25"><Icon name="back" size={20} className="rotate-90" /></button>
            <button onClick={() => move(s.id, 1)} disabled={i === sections.length - 1} aria-label={`${s.label} nach unten`}
              className="w-11 h-11 flex items-center justify-center text-gray-500 disabled:opacity-25"><Icon name="back" size={20} className="-rotate-90" /></button>
          </div>
        ))}
      </ListGroup>
      <div className="px-4"><button onClick={onDone} className="btn-primary w-full">Fertig</button></div>
    </div>
  )
}

function GlobalSearchResults({ query, onNavigate }) {
  const spices = useStore(s => s.spices)
  const recipes = useStore(s => s.recipes)
  const freezerItems = useFreezer(s => s.items)
  const bottles = useCellar(s => s.bottles)
  const pantryItems = usePantry(s => s.items)

  const results = useMemo(() => {
    const q = query.toLowerCase()
    const hit = (...fields) => fields.some(f => f && String(f).toLowerCase().includes(q))
    return [
      ...spices.filter(s => !s.disposedAt && hit(s.name, s.brand)).map(s => ({ type: 'spice', id: s.id, name: s.name, sub: s.brand })),
      ...freezerItems.filter(i => hit(i.name, i.note)).map(i => ({ type: 'freezer', id: i.id, name: i.name, sub: `${i.portions}× ${i.portionSize || 'Portion'}` })),
      ...bottles.filter(b => hit(b.name, b.winery, b.grape, b.region)).map(b => ({ type: 'cellar', id: b.id, name: b.name, sub: [b.winery, b.vintage].filter(Boolean).join(' · ') })),
      ...pantryItems.filter(i => !i.disposedAt && hit(i.name, i.note)).map(i => ({ type: 'pantry', id: i.id, name: i.name, sub: `${i.quantity}× ${i.unit}` })),
      ...recipes.filter(r => hit(r.title, ...(r.tags ?? []))).map(r => ({ type: 'recipe', id: r.id, name: r.title, sub: (r.tags ?? []).join(', ') })),
    ].slice(0, 30)
  }, [query, spices, recipes, freezerItems, bottles, pantryItems])

  if (results.length === 0) {
    return <p className="px-6 py-8 text-center text-callout text-gray-500 dark:text-gray-400">Nichts gefunden für „{query}“.</p>
  }
  return (
    <ListGroup title={`${results.length} Treffer`}>
      {results.map(r => {
        const meta = TYPE_META[r.type]
        return (
          <ListRow key={`${r.type}-${r.id}`} onClick={() => onNavigate(meta.section, r.id)} chevron
            leading={<IconTile icon={meta.icon} tone={meta.tone} />}
            title={r.name} subtitle={[meta.label, r.sub].filter(Boolean).join(' · ')} />
        )
      })}
    </ListGroup>
  )
}
