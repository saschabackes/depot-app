
// Basis-Lagerfähigkeit in Jahren [min, max] nach Weinfarbe
const COLOR_BASE = {
  rot:    [3, 8],
  weiß:   [1, 4],
  rosé:   [1, 2],
  schaum: [1, 3],
}

// Rebsorten-Multiplikatoren (lowercase-Match)
const GRAPE_FACTORS = {
  // Langlebige Rote
  'cabernet sauvignon': 2.0, 'nebbiolo': 2.0, 'tempranillo': 1.8,
  'syrah': 1.8, 'shiraz': 1.8, 'merlot': 1.5, 'malbec': 1.5,
  'sangiovese': 1.8, 'mourvèdre': 1.6, 'tannat': 2.0,
  'spätburgunder': 1.5, 'pinot noir': 1.5,
  'primitivo': 1.3, 'zinfandel': 1.3,
  'blaufränkisch': 1.4, 'zweigelt': 1.2, 'st. laurent': 1.3,
  'dornfelder': 1.0, 'trollinger': 0.8, 'portugieser': 0.8,
  'lemberger': 1.3, 'aglianico': 2.0, 'montepulciano': 1.3,
  // Langlebige Weiße
  'riesling': 1.8, 'chardonnay': 1.5, 'chenin blanc': 1.6,
  'sémillon': 1.5, 'grüner veltliner': 1.3,
  // Kurzlebige Weiße
  'grauburgunder': 0.8, 'pinot grigio': 0.8,
  'müller-thurgau': 0.6, 'rivaner': 0.6,
  'muskateller': 0.7, 'gelber muskateller': 0.7,
  'sauvignon blanc': 0.9, 'weißburgunder': 0.9, 'pinot blanc': 0.9,
  'silvaner': 0.8, 'bacchus': 0.6, 'scheurebe': 0.8,
  'gutedel': 0.6, 'chasselas': 0.6,
  'gewürztraminer': 1.0, 'viognier': 0.8, 'verdejo': 0.7,
  'albariño': 0.8, 'vermentino': 0.7, 'trebbiano': 0.6,
  'garganega': 0.8, 'cortese': 0.7,
}

// Klassifikations-Multiplikatoren (lowercase-Match)
const CLASS_FACTORS = {
  // Spitze (×2-3)
  'trockenbeerenauslese': 3.0, 'eiswein': 2.5, 'beerenauslese': 2.5,
  'grand cru': 2.5, 'gran reserva': 2.5, 'vdp große lage': 2.5,
  'riserva': 2.0, 'grande reserva': 2.0,
  // Gehoben (×1.3-1.8)
  'auslese': 1.8, 'spätlese': 1.5, 'premier cru': 1.8,
  'vdp erste lage': 1.8, 'reserva': 1.5, 'crianza': 1.3,
  'kabinett': 1.3, 'docg': 1.3, 'doc': 1.2, 'aoc': 1.2, 'aop': 1.2,
  'doca': 1.3, 'dac': 1.2, 'classico': 1.2, 'superiore': 1.3,
  'vdp ortswein': 1.3, 'vdp gutswein': 1.1,
  'cru bourgeois': 1.5, 'prädikatswein': 1.3, 'qualitätswein': 1.0,
  // Basis (×0.7-0.9)
  'landwein': 0.8, 'vin de pays': 0.8, 'igp': 0.8, 'igt': 0.8,
  'joven': 0.7, 'vinho regional': 0.8,
}

function matchFactor(input, table) {
  if (!input) return 1.0
  const lower = input.toLowerCase().trim()
  if (table[lower]) return table[lower]
  // Teilwort-Match für zusammengesetzte Rebsorten ("Cuvée Cabernet Sauvignon")
  for (const [key, factor] of Object.entries(table)) {
    if (lower.includes(key) || key.includes(lower)) return factor
  }
  return 1.0
}

export function estimateDrinkWindow(vintage, color, grape, classification, alcoholFree) {
  if (!vintage || vintage < 1900) return null

  if (alcoholFree) {
    return { drinkFrom: vintage, drinkUntil: vintage + 2 }
  }

  const [baseMin, baseMax] = COLOR_BASE[color] || COLOR_BASE.rot
  const grapeFactor = matchFactor(grape, GRAPE_FACTORS)
  const classFactor = matchFactor(classification, CLASS_FACTORS)
  const combined = grapeFactor * classFactor

  let minYears = Math.round(baseMin * combined)
  let maxYears = Math.round(baseMax * combined)

  if (maxYears < 1) maxYears = 1
  if (minYears < 0) minYears = 0

  return {
    drinkFrom: vintage + minYears,
    drinkUntil: vintage + maxYears,
  }
}
