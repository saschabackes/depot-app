// Shelly Cloud API Proxy – CORS-sicherer Proxy für Sensordaten
var ALLOWED_ORIGINS = ['https://depotapp.online', 'https://depotapp.netlify.app']

function corsHeaders(event) {
  var origin = (event && event.headers && event.headers.origin || '').toLowerCase()
  return {
    'Access-Control-Allow-Origin':  ALLOWED_ORIGINS.indexOf(origin) >= 0 ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type':                 'application/json',
  }
}

function ok(headers, data)       { return { statusCode: 200, headers, body: JSON.stringify(data) } }
function err(headers, msg, code) { return { statusCode: code || 500, headers, body: JSON.stringify({ error: msg }) } }

exports.handler = async function(event) {
  var CORS = corsHeaders(event)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'POST,OPTIONS' } }
  }
  if (event.httpMethod !== 'POST') {
    return err(CORS, 'POST only', 405)
  }

  var body
  try { body = JSON.parse(event.body) } catch { return err(CORS, 'Invalid JSON', 400) }

  var authKey  = body.authKey
  var server   = body.server
  var deviceId = body.deviceId
  var action   = body.action || 'status'

  if (!authKey || !server) return err(CORS, 'authKey and server required', 400)

  // Validate server ID format (e.g. "eu", "48-eu", "us")
  if (!/^[a-z0-9-]{1,20}$/.test(server)) return err(CORS, 'Invalid server ID', 400)

  var baseUrl = 'https://shelly-' + server + '.shelly.cloud'

  try {
    if (action === 'list') {
      var url = baseUrl + '/device/all_status'
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'auth_key=' + encodeURIComponent(authKey),
      })
      if (res.status === 429) return err(CORS, 'Shelly Rate-Limit erreicht — bitte 1 Minute warten und erneut versuchen.', 429)
      var data
      try { data = await res.json() } catch { return err(CORS, 'Shelly HTTP ' + res.status, 502) }
      if (!data.isok) return err(CORS, (data.errors || []).join(', ') || 'Shelly API error (HTTP ' + res.status + ')', 502)

      var devices = []
      var devStatuses = data.data?.devices_status || data.data || {}

      Object.keys(devStatuses).forEach(function(id) {
        if (id === 'devices_status' || id === 'pending_notifications') return
        var d = devStatuses[id]
        if (!d || typeof d !== 'object') return

        var keys = Object.keys(d)
        var online = d.cloud?.connected ?? d.online ?? false

        // Detect ambient temperature/humidity sensors (not internal device temps)
        var hasTemp = keys.some(function(k) { return /^temperature:\d+$/.test(k) })
          || !!(d.tmp) || !!(d.ext_temperature)
        var hasHum = keys.some(function(k) { return /^humidity:\d+$/.test(k) })
          || !!(d.hum) || !!(d.ext_humidity)

        var model = d.code || 'Shelly'
        var ip = d.wifi?.sta_ip || ''

        devices.push({
          id: id,
          name: model,
          ip: ip,
          online: online,
          hasTemp: hasTemp,
          hasHum: hasHum,
        })
      })

      // Sort: sensors first, then online, then by name
      devices.sort(function(a, b) {
        var sa = (a.hasTemp || a.hasHum) ? 0 : 1
        var sb = (b.hasTemp || b.hasHum) ? 0 : 1
        if (sa !== sb) return sa - sb
        if (a.online !== b.online) return a.online ? -1 : 1
        return a.name.localeCompare(b.name)
      })

      return ok(CORS, { devices: devices })
    }

    if (action === 'status') {
      if (!deviceId) return err(CORS, 'deviceId required for status', 400)

      var res = await fetch(baseUrl + '/device/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'auth_key=' + encodeURIComponent(authKey) + '&id=' + encodeURIComponent(deviceId),
      })
      if (res.status === 429) return err(CORS, 'Rate-Limit — bitte kurz warten.', 429)
      var data
      try { data = await res.json() } catch { return err(CORS, 'Shelly HTTP ' + res.status, 502) }
      if (!data.isok) return err(CORS, (data.errors || []).join(', ') || 'Shelly API error', 502)

      // data.data contains the flat device status (same structure as in all_status)
      var s = data.data?.device_status || data.data || {}

      // Gen2+ components (temperature:0, humidity:0)
      var temp = null, hum = null
      Object.keys(s).forEach(function(k) {
        if (/^temperature:\d+$/.test(k) && temp === null) temp = s[k].tC
        if (/^humidity:\d+$/.test(k) && hum === null)     hum = s[k].rh
      })
      // Gen1 sensors
      if (temp === null) temp = s.tmp?.tC ?? s.ext_temperature?.['0']?.tC ?? null
      if (hum === null)  hum = s.hum?.value ?? s.ext_humidity?.['0']?.hum ?? null

      return ok(CORS, {
        online:      s.cloud?.connected ?? data.data?.online ?? false,
        temperature: temp,
        humidity:    hum,
        updatedAt:   s._updated ?? null,
      })
    }

    return err(CORS, 'Unknown action: ' + action, 400)

  } catch (e) {
    return err(CORS, 'Proxy error: ' + e.message + ' (URL: ' + baseUrl + ')', 502)
  }
}
