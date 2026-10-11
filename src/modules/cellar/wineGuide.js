// „Erklär mir den Wein“ – regelbasiertes Weinwissen in Alltagssprache
import { dishById } from './pairing'

// Rebsorten: Stil in einfachen Worten, typische Aromen, Körper, Gerbstoff, passende Speisen
const GRAPES = [
  // Weiß
  { id: 'riesling', names: ['riesling'], color: 'weiß', body: 'leicht', tannin: null,
    style: 'lebendig und frisch mit spürbarer Säure – von knochentrocken bis edelsüß',
    aromas: 'Zitrus, grüner Apfel, Pfirsich; gereift auch Honig und eine leichte „Petrol“-Note',
    dishes: ['fisch_zart', 'asia_süss', 'schwein', 'salat'] },
  { id: 'weissburgunder', names: ['weißburgunder', 'weissburgunder', 'pinot blanc', 'pinot bianco'], color: 'weiß', body: 'mittel',
    style: 'mild und unaufdringlich, mit sanfter Säure', aromas: 'Birne, Apfel, Mandel', dishes: ['fisch_zart', 'gemüse', 'pasta_sahne', 'geflügel'] },
  { id: 'grauburgunder', names: ['grauburgunder', 'pinot gris', 'pinot grigio', 'ruländer'], color: 'weiß', body: 'mittel',
    style: 'rund und weich, etwas kräftiger als Weißburgunder', aromas: 'Birne, Nuss, reife gelbe Früchte', dishes: ['geflügel', 'pasta_sahne', 'risotto', 'fisch_kräftig'] },
  { id: 'chardonnay', names: ['chardonnay'], color: 'weiß', body: 'voll',
    style: 'vielseitig: frisch-mineralisch (z. B. Chablis) oder cremig-buttrig, wenn er im Holzfass reift', aromas: 'Apfel, Melone, mit Holz auch Butter, Vanille, Toast', dishes: ['geflügel', 'fisch_kräftig', 'pasta_sahne', 'risotto'] },
  { id: 'sauvignon_blanc', names: ['sauvignon blanc', 'sauvignon'], color: 'weiß', body: 'leicht',
    style: 'knackig, aromatisch und sehr frisch', aromas: 'Stachelbeere, Holunder, frisch gemähtes Gras, Paprika', dishes: ['salat', 'fisch_zart', 'käse_weich', 'gemüse'] },
  { id: 'silvaner', names: ['silvaner', 'sylvaner'], color: 'weiß', body: 'leicht',
    style: 'zurückhaltend, erdig-frisch – ein klassischer Essensbegleiter', aromas: 'grüne Kräuter, Heu, Apfel', dishes: ['gemüse', 'fisch_zart', 'salat'] },
  { id: 'müller_thurgau', names: ['müller-thurgau', 'müller thurgau', 'rivaner'], color: 'weiß', body: 'leicht',
    style: 'leicht und unkompliziert, mild in der Säure', aromas: 'Muskat-Hauch, Apfel, Pfirsich', dishes: ['salat', 'gemüse', 'fisch_zart'] },
  { id: 'gewürztraminer', names: ['gewürztraminer', 'traminer'], color: 'weiß', body: 'voll',
    style: 'üppig und sehr duftig, oft mit leichter Süße', aromas: 'Rose, Litschi, exotische Früchte', dishes: ['asia_süss', 'indisch', 'käse_blau'] },
  { id: 'gruener_veltliner', names: ['grüner veltliner', 'gruener veltliner', 'veltliner'], color: 'weiß', body: 'mittel',
    style: 'frisch und würzig – Österreichs Leitsorte', aromas: 'weißer Pfeffer („Pfefferl“), grüner Apfel, Zitrus', dishes: ['schwein', 'gemüse', 'salat', 'geflügel'] },
  { id: 'scheurebe', names: ['scheurebe'], color: 'weiß', body: 'mittel',
    style: 'fruchtig-aromatisch, oft halbtrocken', aromas: 'schwarze Johannisbeere, Grapefruit', dishes: ['asia_süss', 'salat'] },
  { id: 'muskateller', names: ['muskateller', 'moscato', 'muscat'], color: 'weiß', body: 'leicht',
    style: 'blumig und traubig, häufig mit Restsüße', aromas: 'frische Trauben, Holunderblüte', dishes: ['aperitif', 'dessert_fruit'] },
  { id: 'chenin', names: ['chenin blanc', 'chenin'], color: 'weiß', body: 'mittel',
    style: 'lebhafte Säure, trocken bis süß', aromas: 'Quitte, Apfel, Honig', dishes: ['geflügel', 'asia_süss', 'käse_weich'] },
  { id: 'albarino', names: ['albariño', 'albarino'], color: 'weiß', body: 'leicht',
    style: 'frisch und salzig-mineralisch', aromas: 'Zitrus, Pfirsich, Meeresbrise', dishes: ['meeresfrüchte', 'fisch_zart', 'sushi'] },
  // Rot
  { id: 'spätburgunder', names: ['spätburgunder', 'pinot noir', 'blauburgunder', 'pinot nero'], color: 'rot', body: 'leicht', tannin: 'weich',
    style: 'elegant und eher leicht, mit wenig Gerbstoff', aromas: 'Kirsche, Erdbeere, Waldboden', dishes: ['geflügel', 'ente_gans', 'pilze', 'fisch_kräftig'] },
  { id: 'dornfelder', names: ['dornfelder'], color: 'rot', body: 'mittel', tannin: 'weich',
    style: 'dunkel, fruchtig und weich – unkompliziert', aromas: 'Brombeere, Kirsche', dishes: ['pizza', 'pasta_tomate', 'gegrilltes'] },
  { id: 'lemberger', names: ['lemberger', 'blaufränkisch', 'blaufrankisch'], color: 'rot', body: 'mittel', tannin: 'mittel',
    style: 'würzig mit frischer Säure', aromas: 'Brombeere, Pfeffer, Kirsche', dishes: ['schwein', 'wild', 'gegrilltes'] },
  { id: 'trollinger', names: ['trollinger', 'schiava', 'vernatsch'], color: 'rot', body: 'leicht', tannin: 'weich',
    style: 'hell, leicht und süffig', aromas: 'rote Beeren, Mandel', dishes: ['schwein', 'käseplatte'] },
  { id: 'zweigelt', names: ['zweigelt'], color: 'rot', body: 'mittel', tannin: 'weich',
    style: 'saftig und fruchtig', aromas: 'Sauerkirsche, Weichsel', dishes: ['schwein', 'pizza', 'pasta_tomate'] },
  { id: 'merlot', names: ['merlot'], color: 'rot', body: 'mittel', tannin: 'weich',
    style: 'samtig und rund – ein guter Einstieg in Rotwein', aromas: 'Pflaume, Kirsche, Schokolade', dishes: ['rind_lamm', 'pasta_tomate', 'pilze', 'pizza'] },
  { id: 'cabernet', names: ['cabernet sauvignon', 'cabernet'], color: 'rot', body: 'voll', tannin: 'kräftig',
    style: 'kräftig mit viel Gerbstoff – braucht Zeit oder Luft', aromas: 'schwarze Johannisbeere, Zeder, Paprika', dishes: ['rind_lamm', 'wild', 'gegrilltes', 'käse_hart'] },
  { id: 'cabernet_franc', names: ['cabernet franc'], color: 'rot', body: 'mittel', tannin: 'mittel',
    style: 'frisch-würzig, etwas leichter als Cabernet Sauvignon', aromas: 'Himbeere, grüne Paprika, Veilchen', dishes: ['schwein', 'geflügel', 'pilze'] },
  { id: 'syrah', names: ['syrah', 'shiraz'], color: 'rot', body: 'voll', tannin: 'kräftig',
    style: 'dunkel, kräftig und pfeffrig', aromas: 'Brombeere, schwarzer Pfeffer, Rauch', dishes: ['gegrilltes', 'wild', 'rind_lamm'] },
  { id: 'grenache', names: ['grenache', 'garnacha', 'cannonau'], color: 'rot', body: 'voll', tannin: 'mittel',
    style: 'warm und fruchtig, oft mit viel Alkohol', aromas: 'Erdbeere, Himbeere, Kräuter', dishes: ['gegrilltes', 'pizza', 'rind_lamm'] },
  { id: 'tempranillo', names: ['tempranillo', 'tinta roriz', 'rioja'], color: 'rot', body: 'mittel', tannin: 'mittel',
    style: 'spanischer Klassiker, mit Fassreife weich und würzig', aromas: 'Kirsche, Tabak, Vanille, Leder', dishes: ['rind_lamm', 'gegrilltes', 'käse_hart'] },
  { id: 'sangiovese', names: ['sangiovese', 'chianti', 'brunello'], color: 'rot', body: 'mittel', tannin: 'mittel',
    style: 'herzhaft mit frischer Säure – Italiens Tomaten-Wein', aromas: 'Sauerkirsche, Tomatenblatt, Kräuter', dishes: ['pasta_tomate', 'pizza', 'käse_hart'] },
  { id: 'nebbiolo', names: ['nebbiolo', 'barolo', 'barbaresco'], color: 'rot', body: 'voll', tannin: 'kräftig',
    style: 'hell in der Farbe, aber sehr kräftig im Gerbstoff – braucht Jahre', aromas: 'Rose, Teer, Kirsche', dishes: ['wild', 'pilze', 'rind_lamm', 'käse_hart'] },
  { id: 'primitivo', names: ['primitivo', 'zinfandel'], color: 'rot', body: 'voll', tannin: 'weich',
    style: 'üppig und weich, oft mit leichter Süße', aromas: 'Pflaume, Rosine, Marmelade', dishes: ['gegrilltes', 'pizza', 'schokolade'] },
  { id: 'montepulciano', names: ['montepulciano'], color: 'rot', body: 'mittel', tannin: 'mittel',
    style: 'dunkel und saftig, unkompliziert', aromas: 'Kirsche, Pflaume', dishes: ['pizza', 'pasta_tomate'] },
  { id: 'malbec', names: ['malbec'], color: 'rot', body: 'voll', tannin: 'mittel',
    style: 'dunkel, saftig und samtig', aromas: 'Brombeere, Pflaume, Veilchen', dishes: ['gegrilltes', 'rind_lamm'] },
  { id: 'gamay', names: ['gamay', 'beaujolais'], color: 'rot', body: 'leicht', tannin: 'weich',
    style: 'leicht, fruchtig und süffig – gerne leicht gekühlt', aromas: 'Himbeere, Banane, Kirsche', dishes: ['geflügel', 'käseplatte', 'schwein'] },
  { id: 'regent', names: ['regent'], color: 'rot', body: 'mittel', tannin: 'mittel',
    style: 'farbintensiv und fruchtig', aromas: 'Kirsche, Johannisbeere', dishes: ['gegrilltes', 'pasta_tomate'] },
  { id: 'portugieser', names: ['portugieser'], color: 'rot', body: 'leicht', tannin: 'weich',
    style: 'leicht und mild', aromas: 'rote Beeren', dishes: ['schwein', 'käseplatte'] },
]

// Fachbegriffe
export const GLOSSARY = {
  'Kabinett': 'Prädikat für leichte, feine Weine aus reifen Trauben – oft wenig Alkohol. Kann trocken oder fruchtsüß sein, das steht meist zusätzlich auf dem Etikett.',
  'Spätlese': 'Später gelesene, reifere Trauben – dadurch kräftiger und aromatischer als ein Kabinett. Kann trocken oder süß sein.',
  'Auslese': 'Nur besonders reife Trauben werden verwendet – intensiv, oft mit spürbarer Süße. Gut zu Dessert oder kräftigem Käse.',
  'Beerenauslese': 'Edelsüß aus überreifen, teils edelfaulen Beeren – ein Dessertwein, in kleinen Gläsern serviert.',
  'Trockenbeerenauslese': 'Die höchste Süßestufe aus eingeschrumpften Beeren – sehr selten, sehr süß, extrem lange haltbar.',
  'Eiswein': 'Aus Trauben, die gefroren gelesen wurden – konzentriert süß mit kräftiger Säure.',
  'Qualitätswein': 'Wein aus einem bestimmten deutschen Anbaugebiet – die Basisstufe für ordentliche Weine.',
  'Prädikatswein': 'Qualitätswein mit Reifegrad-Prädikat (Kabinett, Spätlese, Auslese …).',
  'Landwein': 'Einfache Stufe mit weiter gefasster Herkunft – meist unkompliziert.',
  'VDP Gutswein': 'VDP = Verband der Prädikatsweingüter. Gutswein ist ihre Einstiegsstufe – vergleichbar mit einem Hauswein.',
  'VDP Ortswein': 'VDP-Wein aus einem bestimmten Ort – eine Stufe über dem Gutswein.',
  'VDP Erste Lage': 'VDP-Wein aus einer sehr guten Einzellage – zweithöchste Stufe.',
  'VDP Große Lage': 'Die Spitzenstufe des VDP aus den besten Weinbergen. Trocken heißt sie „Großes Gewächs“ (GG).',
  'DOCG': 'Italiens höchste Herkunftsstufe mit strengen Regeln (z. B. Barolo, Chianti Classico).',
  'DOC': 'Geschützte Herkunft mit Qualitätsregeln – Italien bzw. Portugal.',
  'IGT': 'Italienischer Landwein – manchmal einfache Weine, manchmal bewusst regelfreie Spitzenweine („Super-Tuscans“).',
  'Riserva': 'Länger gereift als die Normalversion – meist kräftiger und weicher.',
  'Classico': 'Aus dem historischen Kerngebiet einer Region, z. B. Chianti Classico.',
  'Superiore': 'Etwas mehr Alkohol bzw. längere Reife als die Basisversion.',
  'AOC': 'Geschützte Herkunft in Frankreich (heute auch AOP) – sagt, woher der Wein stammt.',
  'AOP': 'Geschützte Herkunft in Frankreich – Nachfolger von AOC.',
  'IGP': 'Französischer bzw. europäischer Landwein mit geschützter geografischer Angabe.',
  'Grand Cru': 'In Frankreich die besten Lagen bzw. Weingüter – Spitzenklasse.',
  'Premier Cru': 'Sehr gute Lage, eine Stufe unter Grand Cru (im Bordeaux teils umgekehrt benannt).',
  'Cru Bourgeois': 'Klassifizierte gute Weingüter im Médoc (Bordeaux).',
  'Crianza': 'Spanien: mindestens 2 Jahre gereift, davon ein Teil im Holzfass.',
  'Reserva': 'Spanien/Portugal: länger gereift (bei Rotwein mind. 3 Jahre) – weicher und würziger.',
  'Gran Reserva': 'Spanien: nur in guten Jahren, mind. 5 Jahre gereift – sehr weich und komplex.',
  'Joven': 'Spanien: junger Wein ohne lange Holzreife – frisch und fruchtig.',
  'DAC': 'Österreich: Herkunftsbezeichnung mit typischem Stil der Region.',
  'trocken': 'Kaum Restzucker – schmeckt nicht süß.',
  'halbtrocken': 'Ein wenig Restsüße, aber nicht süß wie Saft. „Feinherb“ ist ähnlich.',
  'feinherb': 'Leicht süßlich, aber durch Säure ausbalanciert – liegt zwischen trocken und lieblich.',
  'lieblich': 'Deutlich süß schmeckend.',
  'süß': 'Ausgeprägte Süße – Dessertwein.',
  'brut': 'Bei Sekt/Champagner: trocken. „Brut“ ist der Standard.',
  'extra brut': 'Bei Sekt/Champagner: sehr trocken.',
  'brut nature': 'Bei Sekt/Champagner: ganz ohne zugesetzten Zucker – knochentrocken.',
  'extra dry': 'Bei Sekt verwirrend: etwas SÜSSER als „brut“.',
  'Tannin': 'Gerbstoff aus Traubenschalen und Holz – macht den Mund „pelzig“. Viel Tannin passt gut zu Fleisch und wird mit den Jahren weicher.',
  'Cuvée': 'Mischung aus mehreren Rebsorten oder Fässern.',
  'Barrique': 'Kleines Eichenfass – gibt dem Wein Vanille-, Toast- und Holznoten.',
  'Dekantieren': 'Wein in eine Karaffe umfüllen: junge kräftige Weine öffnen sich durch Luft, alte werden vom Bodensatz getrennt.',
  'Depot': 'Bodensatz in älteren Rotweinen – harmlos, aber bitter. Flasche vorher aufrecht stellen und vorsichtig umgießen.',
}

const norm = s => (s || '').toLowerCase()
const grapeLabel = g => g.names[0].replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase())

// Farbe einbeziehen: „Sauvignon“ im Rotwein ist Cabernet Sauvignon, nicht Sauvignon Blanc
export function findGrapes(grape, color) {
  let g = norm(grape)
  if (!g) return []
  const found = []
  // längste Namen zuerst, gefundene Stelle aus dem Text entfernen (verhindert Doppeltreffer)
  const entries = GRAPES.flatMap(x => x.names.map(n => ({ x, n }))).sort((a, b) => b.n.length - a.n.length)
  for (const { x, n } of entries) {
    if (!g.includes(n)) continue
    if (color && ['rot', 'weiß'].includes(color) && x.color !== color) continue
    if (!found.includes(x)) found.push(x)
    g = g.replace(n, ' ')
  }
  return found
}

const isSparklingWine = b => b.color === 'schaum' || b.wineType === 'sekt'
const isSweet = b => ['lieblich', 'süß'].includes(b.sweetness) ||
  ['Auslese', 'Beerenauslese', 'Trockenbeerenauslese', 'Eiswein', 'Strohwein'].includes(b.classification)

function bodyOf(b, grapes) {
  const order = { leicht: 0, mittel: 1, voll: 2 }
  const tp = b.tasteProfile?.body
  if (tp) return tp
  if (!grapes.length) return b.color === 'rot' ? 'mittel' : 'leicht'
  return grapes.reduce((max, g) => (order[g.body] > order[max] ? g.body : max), grapes[0].body)
}

// Trinktemperatur + praktischer Hinweis (Kühlschrank ~7 °C, Zimmer ~21 °C)
export function servingTemp(b, grapes = findGrapes(b.grape, b.color)) {
  if (b.wineType === 'gluehwein') return { range: '60–70 °C', hint: 'Erwärmen, aber nicht kochen lassen.' }
  if (isSparklingWine(b)) return { range: '6–8 °C', hint: 'Gut gekühlt direkt aus dem Kühlschrank.' }
  if (isSweet(b)) return { range: '8–10 °C', hint: 'Aus dem Kühlschrank, kurz stehen lassen.' }
  const body = bodyOf(b, grapes)
  if (b.color === 'weiß' || b.color === 'rosé') {
    return body === 'voll'
      ? { range: '10–12 °C', hint: 'Aus dem Kühlschrank nehmen und etwa 15 Minuten stehen lassen.' }
      : { range: '8–10 °C', hint: 'Aus dem Kühlschrank, 5–10 Minuten stehen lassen.' }
  }
  if (body === 'leicht') return { range: '14–16 °C', hint: 'Leicht gekühlt: etwa 30 Minuten in den Kühlschrank.' }
  if (body === 'mittel') return { range: '16–17 °C', hint: 'Zimmertemperatur ist zu warm – 15–20 Minuten in den Kühlschrank.' }
  return { range: '17–18 °C', hint: 'Knapp unter Zimmertemperatur – 10 Minuten in den Kühlschrank.' }
}

export function decantAdvice(b, grapes = findGrapes(b.grape, b.color)) {
  if (b.color !== 'rot' || isSparklingWine(b)) return { needed: false, text: 'Nicht nötig – einfach öffnen und einschenken.' }
  const age = b.vintage ? new Date().getFullYear() - b.vintage : 0
  const body = bodyOf(b, grapes)
  const tannic = grapes.some(g => g.tannin === 'kräftig') || b.tasteProfile?.tannin === 'kräftig'
  if (age >= 12) return { needed: true, text: 'Älterer Rotwein: Flasche einige Stunden aufrecht stellen und vorsichtig umgießen, damit der Bodensatz (Depot) zurückbleibt. Bald nach dem Öffnen trinken.' }
  if ((tannic || body === 'voll') && age <= 6) return { needed: true, text: 'Jung und kräftig: etwa eine Stunde vorher in eine Karaffe umfüllen – dann wird er weicher und duftiger.' }
  if (body === 'mittel' || tannic) return { needed: false, text: 'Kein Muss – etwa 30 Minuten vorher öffnen tut ihm gut.' }
  return { needed: false, text: 'Nicht nötig – einfach öffnen und einschenken.' }
}

export function glassAdvice(b, grapes = findGrapes(b.grape, b.color)) {
  if (isSparklingWine(b)) return 'Sektglas – oder ein schlankes Weißweinglas für mehr Duft.'
  if (isSweet(b)) return 'Kleines Dessertweinglas, kleine Mengen einschenken.'
  if (b.color === 'weiß' || b.color === 'rosé') return 'Weißweinglas mit schmalerer Öffnung – hält den Wein kühl.'
  if (grapes.some(g => ['spätburgunder', 'gamay', 'nebbiolo'].includes(g.id))) return 'Bauchiges Burgunderglas – der feine Duft kann sich entfalten.'
  return 'Großes Rotweinglas (Bordeauxglas), nur zu einem Drittel füllen.'
}

export function maturity(b, effectiveUntil) {
  const y = new Date().getFullYear()
  const until = effectiveUntil ?? b.drinkUntil
  if (!b.drinkFrom || !until) return null
  if (y < b.drinkFrom) return { tone: 'neutral', text: `Noch etwas jung – am besten ab ${b.drinkFrom}. Jetzt geöffnet schmeckt er eher verschlossen.` }
  if (y > until) return { tone: 'expired', text: 'Über dem Höhepunkt – bald trinken, er kann schon an Frucht verloren haben.' }
  if (y === until) return { tone: 'soon', text: 'Jetzt trinken – das ist sein letztes ideales Jahr.' }
  return { tone: 'accent', text: `Trinkreif – jetzt gut, und er kann noch bis ${until} liegen.` }
}

const colorWord = { rot: 'Rotwein', weiß: 'Weißwein', rosé: 'Roséwein', schaum: 'Schaumwein' }

export function portrait(b, grapes = findGrapes(b.grape, b.color)) {
  const parts = []
  const kind = b.wineType === 'sekt' ? 'Sekt' : colorWord[b.color] ?? 'Wein'
  const sweet = b.sweetness && !['brut', 'extra brut', 'brut nature'].includes(b.sweetness) ? `${b.sweetness}er ` : ''
  const origin = [b.region, b.country].filter(Boolean).join(', ')
  parts.push(`Ein ${sweet}${kind}${b.grape ? ` aus ${b.grape}` : ''}${origin ? ` (${origin})` : ''}${b.vintage ? `, Jahrgang ${b.vintage}` : ''}.`)
  if (grapes.length === 1) {
    const g = grapes[0]
    parts.push(`${grapeLabel(g)} ist ${g.style}. Typisch: ${g.aromas}.`)
  } else if (grapes.length > 1) {
    parts.push(`Eine Cuvée – also eine Mischung: ${grapes.map(g => `${grapeLabel(g)} (${g.style.split(' – ')[0]})`).join(' und ')}.`)
  }
  return parts.join(' ')
}

export function foodIdeas(b, grapes = findGrapes(b.grape, b.color)) {
  const sparkling = isSparklingWine(b) ? ['aperitif', 'meeresfrüchte'] : []
  const ids = [...new Set([...(b.pairings ?? []), ...sparkling, ...grapes.flatMap(g => g.dishes)])]
  return ids.map(dishById).filter(Boolean).slice(0, 5)
}

// Fachbegriffe, die zu diesem Wein passen
export function glossaryFor(b, grapes = findGrapes(b.grape, b.color)) {
  const terms = []
  const add = t => { if (GLOSSARY[t] && !terms.includes(t)) terms.push(t) }
  if (b.classification) add(b.classification)
  if (b.sweetness) add(b.sweetness)
  if (b.color === 'rot') add('Tannin')
  if (grapes.length > 1 || /cuv[eé]e/i.test(`${b.name} ${b.grape}`)) add('Cuvée')
  if (/barrique/i.test(`${b.name} ${b.note ?? ''}`)) add('Barrique')
  if (decantAdvice(b, grapes).needed) add('Dekantieren')
  if (b.vintage && new Date().getFullYear() - b.vintage >= 12 && b.color === 'rot') add('Depot')
  return terms
}
