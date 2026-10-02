// ── Bring! API (über Netlify-Proxy) ───────────────────────────────────────────
// Direkte Browser-Anfragen an api.getbring.com scheitern an CORS.
// Deshalb läuft der eigentliche HTTP-Call serverseitig in einer
// Netlify Function unter /.netlify/functions/bring-proxy.

import { authPost } from './authFetch'

const PROXY = '/.netlify/functions/bring-proxy'

async function callProxy(action, params = {}) {
  const res = await authPost(PROXY, { action, ...params })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Fehler ${res.status}`)
  return data
}

// ── Öffentliche API ───────────────────────────────────────────────────────────

export async function bringLogin(email, password) {
  // Gibt { uuid, access_token, refresh_token, name, email, ... } zurück
  return callProxy('login', { email, password })
}

// Neuen access_token via refresh_token holen → { access_token, refresh_token? }
export async function bringRefreshToken(refreshToken) {
  return callProxy('refreshToken', { refreshToken })
}

export async function bringGetLists(userUuid, rawUuid, accessToken) {
  // Gibt [{ listUuid, name, theme }] zurück
  // rawUuid = auth.uuid, userUuid = auth.publicUuid || auth.uuid
  const data = await callProxy('getLists', { userUuid, rawUuid, accessToken })
  return data.lists ?? []
}

export async function bringAddItem(listUuid, accessToken, name, specification = '', userUuid = '') {
  await callProxy('addItem', { listUuid, accessToken, name, specification, userUuid })
}

export async function bringGetItems(listUuid, accessToken, userUuid = '') {
  const data = await callProxy('getItems', { listUuid, accessToken, userUuid })

  // Bring! kann die Liste direkt als Array zurückgeben oder in verschiedenen Feldern verpackt.
  // Unbekanntes Format → Fehler statt leerer Liste (sonst gälten alle Nachkäufe als erledigt)
  const raw = Array.isArray(data)
    ? data
    : (data.purchase ?? data.items ?? data.purchases)
  if (!Array.isArray(raw)) throw new Error('Unerwartete Antwort von Bring!')

  // Feldnamen normalisieren: Bring! nutzt itemId/spec statt name/specification
  const items = raw.map(i => ({
    uuid:          i.uuid          ?? i.itemId ?? i.name ?? '',
    name:          i.name          ?? i.itemId ?? '',
    specification: i.specification ?? i.spec   ?? '',
  })).filter(i => i.name)

  return items
}

export async function bringRemoveItem(listUuid, accessToken, name, userUuid = '') {
  await callProxy('removeItem', { listUuid, accessToken, name, userUuid })
}
