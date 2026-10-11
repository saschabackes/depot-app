// Portionen-Umrechnung für Zutatenzeilen wie „600 g Rindergulasch“ oder „2-3 EL Butterschmalz“

const UNICODE_FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 }

// Eine Zahl: „1,5“, „1.5“, „1/2“, „½“, „1 ½“, „1 1/2“
const NUM = String.raw`(?:\d+\s+\d+\/\d+|\d+\s*[½¼¾⅓⅔⅛]|\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔⅛])`
const LEADING = new RegExp(String.raw`^\s*(${NUM})(?:\s*[-–]\s*(${NUM}))?(\s*)(.*)$`)

// Nach Geschmack – wird nicht hochgerechnet
const TO_TASTE = /^(prisen?|msp\.?|messerspitzen?|spritzer|schuss|etwas|nach geschmack)\b/i
// Mengen mit Gewicht/Volumen → glatt runden statt Brüche
const MASS = /^(g|kg|mg|ml|l|cl|dl|gramm|liter)\b/i

function toNumber(raw) {
  const s = raw.trim()
  if (UNICODE_FRACTIONS[s] != null) return UNICODE_FRACTIONS[s]
  let m = s.match(/^(\d+)\s*([½¼¾⅓⅔⅛])$/)
  if (m) return Number(m[1]) + UNICODE_FRACTIONS[m[2]]
  m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3])
  m = s.match(/^(\d+)\/(\d+)$/)
  if (m) return Number(m[1]) / Number(m[2])
  return Number(s.replace(',', '.'))
}

const dec = n => (Math.round(n * 100) / 100).toLocaleString('de-DE')

// Gibt [Menge, Einheit] zurück – ab 1000 g/ml wird auf kg/l umgestellt
function formatMass(n, unit) {
  const u = unit.toLowerCase()
  if (u === 'kg' || u === 'l' || u === 'liter') return [dec(n), unit]
  if ((u === 'g' || u === 'gramm') && n >= 1000) return [dec(n / 1000), 'kg']
  if (u === 'ml' && n >= 1000) return [dec(n / 1000), 'l']
  if (n >= 100) return [String(Math.round(n / 10) * 10), unit]
  if (n >= 20) return [String(Math.round(n / 5) * 5), unit]
  return [dec(n), unit]
}

// Stückzahlen, Löffel usw.: auf Viertel runden und als Bruch zeigen
function formatCount(n) {
  const q = Math.max(0.25, Math.round(n * 4) / 4)
  const whole = Math.floor(q)
  const frac = q - whole
  const fracStr = { 0.25: '¼', 0.5: '½', 0.75: '¾' }[frac] ?? ''
  if (!whole) return fracStr
  return `${whole}${fracStr}`
}

// Gibt die Zeile mit umgerechneter Menge zurück (unverändert, wenn keine Menge erkennbar)
export function scaleIngredientLine(line, factor) {
  if (!line || !factor || Math.abs(factor - 1) < 1e-9) return line
  const m = String(line).match(LEADING)
  if (!m) return line
  const [, a, b, gap, rest] = m
  if (TO_TASTE.test(rest)) return line
  const unit = (rest.match(/^\S+/) || [''])[0]
  const restNoUnit = rest.slice(unit.length)
  let from, to, outUnit = null
  if (MASS.test(unit)) {
    ;[from, outUnit] = formatMass(toNumber(a) * factor, unit)
    if (b) {
      const [t, u2] = formatMass(toNumber(b) * factor, unit)
      // Gemischte Einheiten vermeiden: Untergrenze in die Einheit der Obergrenze umrechnen
      if (u2 !== outUnit) from = dec(toNumber(a) * factor / 1000)
      to = t; outUnit = u2
    }
  } else {
    from = formatCount(toNumber(a) * factor)
    to = b ? formatCount(toNumber(b) * factor) : null
  }
  const amount = to && to !== from ? `${from}–${to}` : from
  const tail = outUnit ? `${outUnit}${restNoUnit}` : rest
  return `${amount} ${tail.replace(/\s+/g, ' ').trim()}`
}

// „für 4 Personen“ / „ergibt 6 Portionen“ in Freitext
export function servingsFromText(text) {
  const m = String(text || '').match(/(?:für|ergibt|reicht für)\s*(\d{1,2})\s*(?:personen|portionen|pers\.|stück)/i)
  return m ? parseServings(m[1]) : null
}

// Portionen aus schema.org recipeYield: „4“, „4 Personen“, ["4", "4 Portionen"], 4
export function parseServings(yieldValue) {
  const list = Array.isArray(yieldValue) ? yieldValue : [yieldValue]
  for (const v of list) {
    const m = String(v ?? '').match(/\d+/)
    if (m) {
      const n = Number(m[0])
      if (n > 0 && n <= 100) return n
    }
  }
  return null
}
