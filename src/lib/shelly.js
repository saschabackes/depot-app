const PROXY = '/.netlify/functions/shelly-proxy'

export async function shellyListDevices(authKey, server) {
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authKey, server, action: 'list' }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Shelly API error')
  return data.devices
}

export async function shellyGetStatus(authKey, server, deviceId) {
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authKey, server, deviceId, action: 'status' }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Shelly API error')
  return data
}
