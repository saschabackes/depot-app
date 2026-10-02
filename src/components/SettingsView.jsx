import { useState, useEffect } from 'react'
import useStore from './../store/useStore'
import { MODULES_ENABLED, APP_NAME } from '../branding'
import { superListUsers } from '../lib/userAdmin'
import { getLastSeen } from './settings/lastSeen'
import { APP_VERSION, hasUnseenChangelog } from '../changelog'
import ChangelogView from './ChangelogView'
import AppearanceSection from './settings/AppearanceSection'
import HouseholdSection from './settings/HouseholdSection'
import BringSection from './settings/BringSection'
import CookidooSection from './settings/CookidooSection'
import ExportSection from './settings/ExportSection'
import SetupAssistantSection from './settings/SetupAssistantSection'
import InviteSection from './settings/InviteSection'
import MembersSection from './settings/MembersSection'
import SuperAdminSection from './settings/SuperAdminSection'
import FeedbackSection from './settings/FeedbackSection'
import DataManagementSection from './settings/DataManagementSection'
import Sheet from '../ui/Sheet'
import { Segmented } from '../ui/Controls'

const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || '').toLowerCase()


export default function SettingsView({ onClose }) {
  const household = useStore(s => s.household)
  const user = useStore(s => s.user)
  const isOwner      = household?.role === 'owner'
  const isSuperAdmin = !!SUPER_ADMIN_EMAIL && (user?.email || '').toLowerCase() === SUPER_ADMIN_EMAIL
  const [tab, setTab] = useState('settings')  // 'settings' | 'admin' | 'super'
  const [newUserCount, setNewUserCount] = useState(0)
  const [showChangelog, setShowChangelog] = useState(false)
  const [unseenChangelog, setUnseenChangelog] = useState(hasUnseenChangelog())
  const showTabs = isOwner || isSuperAdmin

  // Beim Öffnen (als Super-Admin): zählen wie viele Nutzer seit dem letzten Besuch neu sind
  useEffect(() => {
    if (!isSuperAdmin) return
    const since = getLastSeen()
    superListUsers()
      .then(users => {
        const count = (users || []).filter(u => u.createdAt && u.createdAt > since).length
        setNewUserCount(count)
      })
      .catch(() => {})
  }, [isSuperAdmin])

  const tabs = [
    { id: 'settings', label: 'Allgemein' },
    ...(isOwner ? [{ id: 'admin', label: 'Mitglieder' }] : []),
    ...(isSuperAdmin ? [{ id: 'super', label: newUserCount > 0 ? `Betreiber (${newUserCount})` : 'Betreiber' }] : []),
  ]

  return (
    <Sheet title="Einstellungen" onClose={onClose} cancelLabel="Schließen" z={60}>
      {showTabs && (
        <div className="px-4 pb-4">
          <Segmented label="Bereich" value={tab} options={tabs}
            onChange={t => { setTab(t); if (t === 'super') setNewUserCount(0) }} />
        </div>
      )}

      {tab === 'settings' && (
        <div className="px-4 space-y-7">
          <AppearanceSection />
          <HouseholdSection />
          <BringSection />
          <CookidooSection />
          <ExportSection />
          {MODULES_ENABLED && <SetupAssistantSection onClose={onClose} />}
          <FeedbackSection />
          <button onClick={() => setShowChangelog(true)}
            className="w-full min-h-[44px] text-center text-footnote text-gray-500 dark:text-gray-400">
            {APP_NAME} {APP_VERSION} · <span className="text-primary-500 dark:text-primary-300 font-semibold">Was ist neu?</span>
            {unseenChangelog && <span className="inline-block w-1.5 h-1.5 bg-primary-500 rounded-full ml-1.5 align-middle" />}
          </button>
        </div>
      )}

      {tab === 'admin' && isOwner && (
        <div className="px-4 space-y-7">
          <InviteSection />
          <MembersSection />
          <DataManagementSection />
        </div>
      )}

      {tab === 'super' && isSuperAdmin && (
        <div className="px-4 space-y-7">
          <SuperAdminSection />
        </div>
      )}

      {showChangelog && (
        <ChangelogView onClose={() => { setShowChangelog(false); setUnseenChangelog(false) }} />
      )}
    </Sheet>
  )
}
