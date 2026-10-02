import useStore from '../../store/useStore'
import useDashboardData from '../dashboard/useDashboardData'
import Screen from '../../ui/Screen'
import { ListGroup, ListRow, IconTile } from '../../ui/List'
import { StatusPill } from '../../ui/Controls'
import Icon from '../../ui/Icon'

const AREAS = [
  { id: 'spices',  type: 'spice',   icon: 'leaf',   tone: 'spices',  label: 'Gewürze',  count: c => `${c.spices} ${c.spices === 1 ? 'Eintrag' : 'Einträge'}` },
  { id: 'freezer', type: 'freezer', icon: 'snow',   tone: 'freezer', label: 'Tiefkühl', count: c => `${c.freezer} ${c.freezer === 1 ? 'Eintrag' : 'Einträge'}` },
  { id: 'cellar',  type: 'cellar',  icon: 'wine',   tone: 'cellar',  label: 'Wein',     count: c => `${c.cellar} ${c.cellar === 1 ? 'Flasche' : 'Flaschen'}` },
  { id: 'pantry',  type: 'pantry',  icon: 'pantry', tone: 'pantry',  label: 'Vorrat',   count: c => (c.pantry ? `${c.pantry} ${c.pantry === 1 ? 'Eintrag' : 'Einträge'}` : 'Noch leer') },
]

export default function BestandView({ onOpen, onReview }) {
  const { counts, attentionAll: attention } = useDashboardData()
  const reviewCount = useStore(s => s.pendingInventory.filter(p => p.status === 'ready').length)

  const statusFor = type => {
    const items = attention.filter(a => a.type === type)
    const expired = items.filter(a => a.status === 'expired').length
    const soon = items.length - expired
    return { expired, soon }
  }

  return (
    <Screen title="Bestand">
      <div className="grid grid-cols-2 gap-3 px-4">
        {AREAS.map(a => {
          const st = statusFor(a.type)
          return (
            <button key={a.id} onClick={() => onOpen(a.id)}
              className="bg-white dark:bg-gray-800 rounded-tile p-4 text-left flex flex-col gap-3 active:bg-gray-100 dark:active:bg-gray-700">
              <IconTile icon={a.icon} tone={a.tone} size={44} />
              <div>
                <div className="text-[18px] leading-6 font-bold text-gray-900 dark:text-gray-50">{a.label}</div>
                <div className="text-callout text-gray-500 dark:text-gray-400">{a.count(counts)}</div>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                {st.expired > 0 && <StatusPill tone="expired">{st.expired} abgelaufen</StatusPill>}
                {st.soon > 0 && <StatusPill tone="soon">{st.soon} {a.id === 'cellar' ? 'bald trinken' : 'bald'}</StatusPill>}
                {st.expired === 0 && st.soon === 0 && (
                  <span className="text-footnote text-gray-500 dark:text-gray-400">{a.id === 'pantry' && !counts.pantry ? 'Jetzt einrichten' : 'Alles in Ordnung'}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <ListGroup title="Einräumen" className="mt-6"
        footer="Was du auf der Einkaufsliste abgehakt hast, landet hier – bis es im Regal steht.">
        <ListRow onClick={onReview} chevron
          leading={<IconTile icon="inbox" tone="accent" />}
          title="Noch einzuräumen"
          trailing={<span className="text-callout font-semibold text-gray-500 dark:text-gray-400">{reviewCount}</span>} />
      </ListGroup>
    </Screen>
  )
}

// Kopfleiste innerhalb eines Bereichs (zurück zur Übersicht + Aktionen)
export function SectionBar({ title, onBack, actions, children }) {
  return (
    <div className="flex-none bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-700/70 z-20"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center h-11 px-2">
        <div className="flex-1 min-w-0">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-0.5 min-h-[44px] pr-2 text-[17px] text-primary-500 dark:text-primary-300">
              <Icon name="back" size={22} strokeWidth={2.2} />Bestand
            </button>
          )}
        </div>
        <h1 className="flex-none text-[17px] font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
        <div className="flex-1 min-w-0 flex justify-end items-center">{actions}</div>
      </div>
      {children && <div className="px-4 pb-2.5">{children}</div>}
    </div>
  )
}
