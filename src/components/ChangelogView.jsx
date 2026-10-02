import { useEffect } from 'react'
import { CHANGELOG, markChangelogSeen } from '../changelog'
import { APP_NAME } from '../branding'
import Sheet from '../ui/Sheet'
import { StatusPill } from '../ui/Controls'

const TYPE_LABEL = {
  new:      { label: 'Neu',        tone: 'accent' },
  improved: { label: 'Verbessert', tone: 'neutral' },
  fixed:    { label: 'Behoben',    tone: 'soon' },
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ChangelogView({ onClose }) {
  // Öffnen gilt als „gesehen“ → Hinweispunkt verschwindet
  useEffect(() => { markChangelogSeen() }, [])

  return (
    <Sheet title="Neuigkeiten" onClose={onClose} cancelLabel="Schließen" z={70}>
      <div className="px-4 space-y-6">
        {CHANGELOG.map((release, i) => (
          <section key={release.version}>
            <div className="flex items-baseline gap-2 px-1 pb-2">
              <h3 className="text-headline text-gray-900 dark:text-gray-100">Version {release.version}</h3>
              {i === 0 && <StatusPill tone="accent">aktuell</StatusPill>}
              <span className="ml-auto text-footnote text-gray-500 dark:text-gray-400">{fmtDate(release.date)}</span>
            </div>
            <ul className="bg-white dark:bg-gray-800 rounded-card divide-y divide-gray-100 dark:divide-gray-700">
              {release.entries.map((e, j) => {
                const t = TYPE_LABEL[e.type] ?? TYPE_LABEL.new
                return (
                  <li key={j} className="px-4 py-3 space-y-1">
                    <StatusPill tone={t.tone}>{t.label}</StatusPill>
                    <p className="text-callout text-gray-800 dark:text-gray-200 leading-relaxed">{e.text}</p>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
        <p className="text-footnote text-gray-500 text-center pb-2">{APP_NAME} · Danke, dass du dabei bist</p>
      </div>
    </Sheet>
  )
}
