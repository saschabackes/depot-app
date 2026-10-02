import { useState, useEffect } from 'react'
import useStore from './store/useStore'
import Login from './components/Login'
import SpiceList from './components/SpiceList'
import SpiceForm from './components/SpiceForm'
import ExpiryView from './components/ExpiryView'
import SettingsView from './components/SettingsView'
import HelpView from './components/HelpView'
import ActivityView from './components/ActivityView'
import OnboardingView from './components/OnboardingView'
import InventoryReviewView from './components/InventoryReviewView'
import RecipesView from './components/RecipesView'
import MoreView from './components/MoreView'
import FreezerView from './modules/freezer/FreezerView'
import CellarView from './modules/cellar/CellarView'
import PantryView from './modules/pantry/PantryView'
import UnifiedShoppingList from './modules/shopping/UnifiedShoppingList'
import SpiceSettings from './components/SpiceSettings'
import SpiceSetup from './components/SpiceSetup'
import DashboardView from './modules/dashboard/DashboardView'
import BestandView, { SectionBar } from './modules/bestand/BestandView'
import { useFreezer } from './modules/freezer/store'
import { useCellar } from './modules/cellar/store'
import { usePantry } from './modules/pantry/store'
import { MODULES_ENABLED, APP_NAME } from './branding'
import { hasUnseenChangelog } from './changelog'
import ChangelogView from './components/ChangelogView'
import TabBar from './ui/TabBar'
import { BarButton } from './ui/Screen'
import { Segmented } from './ui/Controls'
import { FeedbackHost } from './ui/feedback'
import Sheet from './ui/Sheet'

const RELOAD_ON_FOCUS_AFTER_MS = 60_000

const TABS = [
  { id: 'start',   label: 'Start',   icon: 'home' },
  { id: 'bestand', label: 'Bestand', icon: 'boxes' },
  { id: 'kochen',  label: 'Kochen',  icon: 'pot' },
  { id: 'einkauf', label: 'Einkauf', icon: 'cart' },
  { id: 'mehr',    label: 'Mehr',    icon: 'more' },
]

const SECTION_TITLES = { spices: 'Gewürze', freezer: 'Tiefkühl', cellar: 'Wein', pantry: 'Vorrat' }

// QR-Etiketten verlinken auf /pantry/<id>
function readDeepLink() {
  const m = window.location.pathname.match(/^\/pantry\/([A-Za-z0-9_-]+)\/?$/)
  return m ? { tab: 'bestand', section: 'pantry', pantryId: m[1] } : null
}

export default function App() {
  const user = useStore(s => s.user)
  const authLoading = useStore(s => s.authLoading)
  const init = useStore(s => s.init)
  const onboardingReplay = useStore(s => s.onboardingReplay)
  const finishOnboarding = useStore(s => s.finishOnboarding)
  const dataError = useStore(s => s.dataError)
  const syncError = useStore(s => s.syncError)
  const dismissSyncError = useStore(s => s.dismissSyncError)
  const [deepLink] = useState(readDeepLink)
  const [route, setRouteState] = useState({ tab: deepLink?.tab ?? 'start', section: deepLink?.section ?? null })
  const [focusRecipeId, setFocusRecipeId] = useState(null)
  const [focusPantryId, setFocusPantryId] = useState(deepLink?.pantryId ?? null)
  const [spiceView, setSpiceView] = useState('bestand')

  // Jeder Wechsel ist ein Verlaufseintrag → Zurück-Geste/-Taste navigiert statt die App zu schließen
  function navigate(tab, section = null) {
    if (tab === route.tab && section === route.section) return
    window.history.pushState({ tab, section }, '')
    setRouteState({ tab, section })
  }

  // Ziele aus Startseite/Suche: Bereich + optional Eintrag
  function openTarget(target, id) {
    if (target === 'recipes') { if (id) setFocusRecipeId(id); return navigate('kochen') }
    if (target === 'shopping') return navigate('einkauf')
    if (target === 'pantry' && id) setFocusPantryId(id)
    navigate('bestand', target)
  }

  useEffect(() => {
    window.history.replaceState(route, '', deepLink ? '/' : window.location.href)
    const onPop = e => setRouteState({ tab: e.state?.tab ?? 'start', section: e.state?.section ?? null })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!syncError) return
    const t = setTimeout(dismissSyncError, 6000)
    return () => clearTimeout(t)
  }, [syncError])

  function handleSectionAdd(section) {
    if (section === 'spices')  { setEditingSpice(null); setShowAddForm(true) }
    if (section === 'freezer') useFreezer.getState().openForm()
    if (section === 'cellar')  useCellar.getState().openForm()
    if (section === 'pantry')  usePantry.getState().openForm()
  }
  function handleSpiceAddInline() { setEditingSpice(null); setShowAddForm(true) }
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSpice, setEditingSpice] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [formPrefill, setFormPrefill] = useState(null)
  const [showSpiceSettings, setShowSpiceSettings] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [swUpdate, setSwUpdate] = useState(false)
  const resolvePending = useStore(s => s.resolvePending)
  const spiceSetupDone = useStore(s => s.spiceSetupDone)
  const completeSpiceSetup = useStore(s => s.completeSpiceSetup)
  const shoppingOpen = useStore(s => s.shoppingItems.filter(i => !i.checked).length)

  const [pendingInvite, setPendingInvite] = useState(null)

  useEffect(() => {
    init()
    const params = new URLSearchParams(window.location.search)
    const invite = params.get('invite')
    if (invite) {
      setPendingInvite(invite.toUpperCase().replace(/[^A-Z0-9]/g, ''))
      window.history.replaceState(window.history.state, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      const s = useStore.getState()
      if (document.visibilityState !== 'visible' || !s.user) return
      if (Date.now() - (s._lastLoadAt ?? 0) < RELOAD_ON_FOCUS_AFTER_MS) return
      s.loadData()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (hasUnseenChangelog()) setShowChangelog(true)
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return
      const check = () => { if (reg.waiting) setSwUpdate(true) }
      check()
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing
        if (!sw) return
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) setSwUpdate(true)
        })
      })
    })
  }, [])

  if (authLoading) return <LoadingScreen />
  if (!user) return <Login />

  // localStorage als Fallback, damit onAuthStateChange-Zwischenzustände keinen Flash erzeugen
  const onboardingDone = user.user_metadata?.onboarding_done || localStorage.getItem('depot_onboarding_done') === '1'
  if (!onboardingDone || onboardingReplay) return <OnboardingView onFinish={finishOnboarding} />

  function handleEditSpice(spice) {
    setEditingSpice(spice)
    setShowAddForm(true)
  }

  function handleFormClose() {
    setShowAddForm(false)
    setEditingSpice(null)
    setFormPrefill(null)
  }

  function handleNewPackage(item) {
    resolvePending(item.id)
    setFormPrefill({ name: item.name, brand: item.brand })
    setEditingSpice(null)
    setShowReview(false)
    setShowAddForm(true)
  }

  // Gewürzmanager (ohne Module) zeigt nur die Gewürze, Depot die volle Navigation
  const tab = MODULES_ENABLED ? route.tab : 'bestand'
  const section = MODULES_ENABLED ? route.section : 'spices'

  const spicesContent = !spiceSetupDone
    ? <SpiceSetup onComplete={completeSpiceSetup} />
    : spiceView === 'bestand'
      ? <SpiceList onEdit={handleEditSpice} onAdd={handleSpiceAddInline} />
      : <ExpiryView onEdit={handleEditSpice} />

  const sectionActions = section && (
    <>
      {section === 'spices' && spiceSetupDone && <BarButton icon="settings" label="Lagerorte und Kategorien" onClick={() => setShowSpiceSettings(true)} />}
      {!MODULES_ENABLED && <BarButton icon="more" label="Einstellungen" onClick={() => setShowSettings(true)} />}
      {(section !== 'spices' || spiceSetupDone) && <BarButton icon="plus" label={`${SECTION_TITLES[section]} hinzufügen`} onClick={() => handleSectionAdd(section)} />}
    </>
  )

  return (
    <div className="h-[100dvh] flex flex-col bg-gray-50 dark:bg-gray-900">
      {swUpdate && (
        <button onClick={() => window.location.reload()}
          className="flex-none bg-primary-500 text-white text-footnote font-semibold px-4 py-2 w-full text-center"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)' }}>
          Neue Version verfügbar – jetzt aktualisieren
        </button>
      )}

      {dataError && (
        <div className="flex-none bg-expired-soft dark:bg-expired-dark-soft px-4 py-2 flex items-start gap-2" role="alert">
          <p className="text-footnote text-expired dark:text-expired-dark flex-1">{dataError}</p>
          <button onClick={() => useStore.setState({ dataError: null })}
            className="text-expired dark:text-expired-dark flex-none text-lg leading-none w-8 h-8" aria-label="Fehlermeldung schließen">×</button>
        </div>
      )}

      {syncError && (
        <div role="alert" className="fixed left-4 right-4 z-[80] max-w-md mx-auto bg-gray-900 dark:bg-gray-700 text-white rounded-[14px] shadow-xl px-4 py-3 flex items-start gap-3 fade-enter"
          style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>
          <p className="text-callout flex-1">{syncError}</p>
          <button onClick={dismissSyncError} className="flex-none text-white/70 text-lg leading-none" aria-label="Hinweis schließen">×</button>
        </div>
      )}

      <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-x-hidden">
        {tab === 'start' && (
          <DashboardView onNavigate={openTarget} onOpenProfile={() => navigate('mehr')} />
        )}

        {tab === 'bestand' && !section && (
          <BestandView onOpen={s => navigate('bestand', s)} onReview={() => setShowReview(true)} />
        )}

        {tab === 'bestand' && section && (
          <>
            <SectionBar title={MODULES_ENABLED ? SECTION_TITLES[section] : APP_NAME}
              onBack={MODULES_ENABLED ? () => navigate('bestand') : null} actions={sectionActions}>
              {section === 'spices' && spiceSetupDone && (
                <Segmented label="Ansicht" value={spiceView} onChange={setSpiceView}
                  options={[{ id: 'bestand', label: 'Bestand' }, { id: 'ablauf', label: 'Ablauf' }]} />
              )}
            </SectionBar>
            <div className="flex-1 min-h-0 flex flex-col" style={{ paddingBottom: MODULES_ENABLED ? 'calc(50px + env(safe-area-inset-bottom, 0px))' : 0 }}>
              {section === 'spices'  && spicesContent}
              {section === 'freezer' && <FreezerView />}
              {section === 'cellar'  && <CellarView />}
              {section === 'pantry'  && <PantryView focusId={focusPantryId} onFocusHandled={() => setFocusPantryId(null)} />}
            </div>
          </>
        )}

        {tab === 'kochen' && <RecipesView focusId={focusRecipeId} onFocusHandled={() => setFocusRecipeId(null)} />}
        {tab === 'einkauf' && <UnifiedShoppingList onReview={() => setShowReview(true)} />}
        {tab === 'mehr' && (
          <MoreView onSettings={() => setShowSettings(true)} onActivity={() => setShowActivity(true)}
            onHelp={() => setShowHelp(true)} onChangelog={() => setShowChangelog(true)} />
        )}
      </main>

      {MODULES_ENABLED && (
        <TabBar tabs={TABS.map(t => t.id === 'einkauf' ? { ...t, badge: shoppingOpen } : t)} active={tab}
          onChange={t => navigate(t)} />
      )}

      {showAddForm && <SpiceForm spice={editingSpice} prefill={formPrefill} onClose={handleFormClose} />}
      {showReview && <InventoryReviewView onClose={() => setShowReview(false)} onNewPackage={handleNewPackage} />}
      {showSpiceSettings && <SpiceSettings onClose={() => setShowSpiceSettings(false)} />}
      {showSettings && <SettingsView onClose={() => setShowSettings(false)} />}
      {showHelp && <HelpView onClose={() => setShowHelp(false)} />}
      {showActivity && <ActivityView onClose={() => setShowActivity(false)} />}
      {pendingInvite && <InviteJoinDialog code={pendingInvite} onClose={() => setPendingInvite(null)} />}
      {showChangelog && <ChangelogView onClose={() => setShowChangelog(false)} />}
      <FeedbackHost />
    </div>
  )
}

function InviteJoinDialog({ code, onClose }) {
  const joinHousehold = useStore(s => s.joinHousehold)
  const [status, setStatus] = useState('confirm')
  const [error, setError] = useState('')
  const displayCode = code.length >= 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code

  async function handleJoin() {
    setStatus('joining')
    setError('')
    try {
      await joinHousehold(code)
      setStatus('success')
      setTimeout(onClose, 2000)
    } catch (e) {
      setError(e.message)
      setStatus('confirm')
    }
  }

  return (
    <Sheet title="Einladung" onClose={onClose} z={70}>
      <div className="px-5 space-y-5 text-center">
        <p className="text-callout text-gray-600 dark:text-gray-300">Du wurdest eingeladen, einem Haushalt beizutreten.</p>
        <div className="bg-white dark:bg-gray-800 rounded-card px-4 py-4">
          <p className="text-footnote text-gray-500 dark:text-gray-400">Einladungscode</p>
          <p className="text-title font-mono tracking-widest text-gray-900 dark:text-gray-50">{displayCode}</p>
        </div>
        {status === 'success' ? (
          <p className="text-callout font-semibold text-primary-600 dark:text-primary-300">Beigetreten! Daten werden geladen …</p>
        ) : (
          <>
            {error && <p className="text-footnote rounded-xl px-3 py-2 bg-expired-soft dark:bg-expired-dark-soft text-expired dark:text-expired-dark">{error}</p>}
            <button onClick={handleJoin} disabled={status === 'joining'} className="btn-primary w-full">
              {status === 'joining' ? 'Trete bei …' : 'Haushalt beitreten'}
            </button>
            <p className="text-footnote text-gray-500 dark:text-gray-400">Du verlässt dabei deinen aktuellen Haushalt.</p>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ── Ladebildschirm ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 flex items-center justify-center" role="status" aria-label="Lädt">
      <div className="text-center text-primary-500 dark:text-primary-300">
        <svg className="w-8 h-8 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    </div>
  )
}
