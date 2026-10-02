import useStore from '../store/useStore'
import Screen from '../ui/Screen'
import { ListGroup, ListRow, IconTile } from '../ui/List'
import { confirmAction } from '../ui/feedback'
import { hasUnseenChangelog, APP_VERSION } from '../changelog'

export default function MoreView({ onSettings, onActivity, onHelp, onChangelog }) {
  const user = useStore(s => s.user)
  const household = useStore(s => s.household)
  const signOut = useStore(s => s.signOut)
  const name = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Benutzer'

  async function handleSignOut() {
    if (await confirmAction({ title: 'Abmelden?', message: 'Deine Daten bleiben gespeichert.', confirmLabel: 'Abmelden', destructive: true })) {
      signOut()
    }
  }

  return (
    <Screen title="Mehr">
      <div className="space-y-6">
        <ListGroup>
          <ListRow onClick={onSettings} chevron
            leading={<span className="w-11 h-11 rounded-full bg-primary-50 dark:bg-primary-900 text-primary-500 dark:text-primary-200 flex items-center justify-center text-[17px] font-bold flex-none">{name.slice(0, 1).toUpperCase()}</span>}
            title={name} subtitle={[user?.email, household?.name].filter(Boolean).join(' · ')} />
        </ListGroup>

        <ListGroup>
          <ListRow onClick={onSettings} chevron leading={<IconTile icon="settings" tone="gray" />} title="Einstellungen" subtitle="Haushalt, Bring!, Cookidoo, Darstellung" />
          <ListRow onClick={onActivity} chevron leading={<IconTile icon="clock" tone="gray" />} title="Verlauf" subtitle="Wer hat was geändert" />
        </ListGroup>

        <ListGroup>
          <ListRow onClick={onChangelog} chevron leading={<IconTile icon="sparkle" tone="accent" />} title="Neuigkeiten"
            subtitle={`Version ${APP_VERSION}`}
            trailing={hasUnseenChangelog() ? <span className="w-2.5 h-2.5 rounded-full bg-primary-500" aria-label="Neu" /> : null} />
          <ListRow onClick={onHelp} chevron leading={<IconTile icon="help" tone="gray" />} title="Hilfe" />
        </ListGroup>

        <ListGroup>
          <ListRow onClick={handleSignOut} tone="danger" leading={<IconTile icon="logout" tone="danger" />} title="Abmelden" />
        </ListGroup>
      </div>
    </Screen>
  )
}
