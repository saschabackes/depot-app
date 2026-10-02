import useStore from '../store/useStore'

export function reportSyncError(label, error) {
  console.error(`🔴 ${label}:`, error)
  useStore.getState()._handleSyncError()
}

// Für fire-and-forget-Schreibvorgänge: query.then(...synced('label'))
export function synced(label) {
  return [
    result => { if (result?.error) reportSyncError(label, result.error) },
    error => reportSyncError(label, error),
  ]
}

// Für Promise.all über mehrere Supabase-Abfragen
export function syncedAll(label, queries) {
  return Promise.all(queries).then(
    results => { const failed = results.find(r => r?.error); if (failed) reportSyncError(label, failed.error) },
    error => reportSyncError(label, error),
  )
}
