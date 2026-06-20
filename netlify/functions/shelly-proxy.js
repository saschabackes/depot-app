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
      var all = data.data || {}
      Object.keys(all).forEach(function(id) {
        var d = all[id]
        if (!d || typeof d !== 'object' || !d._dev_info) return
        var status = d.device_status || {}
        var hasTemp = !!(status.tmp || status['temperature:0'] || status.ext_temperature)
        var hasHum  = !!(status.hum || status['humidity:0'] || status.ext_humidity)
        devices.push({
          id: id,
          name: d._dev_info?.name || d._dev_info?.code || id,
          model: d._dev_info?.code || 'unknown',
          gen: d._dev_info?.gen || 1,
          online: d.online ?? false,
          hasTemp: hasTemp,
          hasHum: hasHum,
          statusKeys: Object.keys(status).filter(function(k) { return k !== '_updated' }).slice(0, 20),
        })
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

      var status = data.data?.device_status || {}

      // Gen1 sensors
      var temp = status.tmp?.tC
        ?? status.ext_temperature?.['0']?.tC
        ?? null
      var hum  = status.hum?.value
        ?? status.ext_humidity?.['0']?.hum
        ?? null

      // Gen2+ sensors
      if (temp === null && status['temperature:0']) temp = status['temperature:0'].tC
      if (hum  === null && status['humidity:0'])    hum  = status['humidity:0'].rh

      return ok(CORS, {
        online:      data.data?.online ?? false,
        temperature: temp,
        humidity:    hum,
        updatedAt:   status._updated ?? null,
      })
    }

    return err(CORS, 'Unknown action: ' + action, 400)

  } catch (e) {
    return err(CORS, 'Proxy error: ' + e.message + ' (URL: ' + baseUrl + ')', 502)
  }
}
