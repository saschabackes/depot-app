import { useMemo } from 'react'
import useStore from '../store/useStore'
import { getMhdStatus } from '../utils/mhd'
import { PACKAGING_TYPES } from '../data/spices'

export default function StatsView() {
  const { spices } = useStore()

  const stats = useMemo(() => {
    const byType = {}
    PACKAGING_TYPES.forEach(t => { byType[t.id] = 0 })
    const mhdStatus = { expired: 0, critical: 0, warning: 0, ok: 0, none: 0 }
    spices.forEach(s => {
      byType[s.packagingType] = (byType[s.packagingType] ?? 0) + 1
      const { status } = getMhdStatus(s.expiryDate)
      mhdStatus[status] = (mhdStatus[status] ?? 0) + 1
    })
    return { total: spices.length, byType, mhdStatus }
  }, [spices])

  const mhdRows = [
    { key: 'expired',  label: 'Abgelaufen',          bg: 'bg-expired-soft dark:bg-expired-dark-soft',       text: 'text-expired dark:text-expired-dark'    },
    { key: 'critical', label: 'Kritisch (< 1 Monat)', bg: 'bg-soon-soft dark:bg-soon-dark-soft', text: 'text-soon dark:text-soon-dark' },
    { key: 'warning',  label: 'Bald (1–3 Monate)',   bg: 'bg-soon-soft dark:bg-soon-dark-soft', text: 'text-soon dark:text-soon-dark' },
    { key: 'ok',       label: 'Frisch (> 3 Monate)', bg: 'bg-primary-100 dark:bg-primary-900/40',   text: 'text-primary-600 dark:text-primary-300'  },
    { key: 'none',     label: 'Kein MHD',            bg: 'bg-gray-100 dark:bg-gray-700',        text: 'text-gray-600 dark:text-gray-300'   },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="text-callout font-semibold text-gray-900 dark:text-gray-100 mb-3">Gesamtübersicht</h3>
        <div className="text-4xl font-bold text-primary-500 dark:text-primary-300 mb-1">{stats.total}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Gewürze insgesamt</div>
      </div>

      <div className="card p-4">
        <h3 className="text-callout font-semibold text-gray-900 dark:text-gray-100 mb-3">Nach Verpackungstyp</h3>
        <div className="space-y-2">
          {PACKAGING_TYPES.map(t => {
            const count = stats.byType[t.id] ?? 0
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
            return (
              <div key={t.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{t.label}</span>
                  <span className="text-gray-500 dark:text-gray-400">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="text-callout font-semibold text-gray-900 dark:text-gray-100 mb-3">MHD-Status</h3>
        <div className="space-y-2">
          {mhdRows.map(row => (
            <div key={row.key} className={`flex items-center justify-between rounded-xl px-3 py-2 ${row.bg}`}>
              <span className={`text-sm font-medium ${row.text}`}>{row.label}</span>
              <span className={`text-lg font-bold ${row.text}`}>{stats.mhdStatus[row.key] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
