// Tägliches Wissen rund um Wein, Gewürze, Kochen und Lebensmittel.
// Der Tag des Jahres bestimmt, welcher Fakt angezeigt wird.

const FACTS = [
  // ── Wein ──────────────────────────────────────────────────────────────────
  { cat: 'wine', keywords: ['riesling'], text: 'Riesling ist die älteste dokumentierte Rebsorte Deutschlands — erstmals 1435 in einer Rechnung des Grafen von Katzenelnbogen erwähnt.' },
  { cat: 'wine', keywords: ['champagner', 'champagne', 'schaum', 'sekt'], text: 'Champagner darf nur so heißen, wenn er aus der Region Champagne stammt. Alles andere ist Crémant, Sekt oder Spumante.' },
  { cat: 'wine', keywords: ['rot', 'rotwein'], text: 'Die rote Farbe im Wein kommt nicht vom Fruchtfleisch, sondern aus der Schale. Weißwein kann deshalb auch aus roten Trauben gekeltert werden — das nennt man „Blanc de Noirs".' },
  { cat: 'wine', keywords: ['trocken'], text: '„Trocken" bedeutet beim Wein weniger als 9 g Restzucker pro Liter. Bei Sekt bedeutet „brut" dasselbe — weniger als 12 g/l.' },
  { cat: 'wine', keywords: ['spätburgunder', 'pinot noir', 'pinot'], text: 'Pinot Noir (Spätburgunder) ist eine der ältesten Kulturreben der Welt. DNA-Analysen zeigen, dass sie nur 1–2 Generationen von der Wildrebe entfernt ist.' },
  { cat: 'wine', keywords: ['korken', 'kork'], text: 'Etwa 3–5 % aller Weine mit Naturkorken haben „Korkschmecker" (TCA). Schraubverschlüsse eliminieren dieses Risiko komplett — ohne Qualitätseinbuße.' },
  { cat: 'wine', keywords: ['rosé', 'rose'], text: 'Rosé bekommt seine Farbe durch kurzen Schalenkontakt (2–20 Stunden). Je kürzer, desto heller — Provence-Rosé hat oft nur 2–4 Stunden.' },
  { cat: 'wine', keywords: ['chardonnay'], text: 'Chardonnay ist die meistangebaute weiße Rebsorte der Welt. Ihr Geschmack variiert enorm je nach Klima — von Apfel und Zitrus bis hin zu tropischen Früchten.' },
  { cat: 'wine', keywords: ['dekantieren', 'dekanter'], text: 'Junge Rotweine profitieren oft mehr vom Dekantieren als alte. Der Sauerstoff öffnet verschlossene Aromen. Alte Weine dekantiert man vorsichtig nur vom Depot.' },
  { cat: 'wine', keywords: ['temperatur'], text: 'Rotwein wird bei „Zimmertemperatur" getrunken — aber das stammt aus der Zeit unbeheizter Schlösser (16–18 °C). Zu warm serviert verliert er Struktur.' },
  { cat: 'wine', keywords: ['cabernet', 'merlot', 'bordeaux'], text: 'Cabernet Sauvignon entstand aus einer natürlichen Kreuzung von Cabernet Franc und Sauvignon Blanc — wahrscheinlich im 17. Jahrhundert in Bordeaux.' },
  { cat: 'wine', keywords: ['grauburgunder', 'pinot grigio', 'pinot gris'], text: 'Grauburgunder und Pinot Grigio sind dieselbe Rebsorte. Der deutsche/elsässische Stil ist voller und würziger, der italienische leichter und frischer.' },
  { cat: 'wine', keywords: ['prosecco'], text: 'Prosecco ist kein Synonym für Schaumwein — es ist eine geschützte Herkunftsbezeichnung aus dem Veneto. Die Rebsorte heißt seit 2009 offiziell „Glera".' },
  { cat: 'wine', keywords: ['sauvignon blanc', 'sauvignon'], text: 'Sauvignon Blanc verdankt seinen typischen Stachelbeer-/Gras-Duft der Aromaverbindung 4MMP. Neuseeland-Sauvignon hat davon besonders viel.' },
  { cat: 'wine', keywords: ['eiswein'], text: 'Für echten Eiswein müssen die Trauben bei mindestens −7 °C am Stock gefrieren und gefroren gepresst werden. Pro Rebe entsteht oft nur ein einziges Glas.' },
  { cat: 'wine', keywords: ['silvaner'], text: 'Silvaner war bis in die 1960er Deutschlands meistangebaute Rebsorte. Heute ist er ein Geheimtipp — besonders aus Franken, wo er mineralisch und kraftvoll wird.' },
  { cat: 'wine', keywords: ['gewürztraminer'], text: 'Gewürztraminer hat seinen Namen von der Südtiroler Gemeinde Tramin. „Gewürz" bezieht sich auf den intensiven, rosenartigen Duft der Rebsorte.' },
  { cat: 'wine', keywords: ['alkoholfrei'], text: 'Alkoholfreier Wein wird aus normalem Wein hergestellt, dem der Alkohol per Vakuumdestillation oder Umkehrosmose entzogen wird — die Aromen bleiben dabei weitgehend erhalten.' },
  { cat: 'wine', keywords: ['jahrgang', 'vintage'], text: 'Ein guter Jahrgang hängt vor allem vom Wetter zur Reifezeit ab. Trockene, warme Herbste mit kühlen Nächten liefern die besten Bedingungen für Säure und Zucker.' },
  { cat: 'wine', keywords: ['barrique', 'eiche', 'holz'], text: 'Ein Barrique-Fass kostet 600–1.200 €, fasst 225 Liter (ca. 300 Flaschen) und wird meist nur 2–3 Mal verwendet. Das erklärt den Preisaufschlag.' },
  { cat: 'wine', keywords: ['malbec'], text: 'Malbec stammt ursprünglich aus Südwestfrankreich, wurde dort aber fast von der Reblaus ausgerottet. In Argentinien fand die Sorte eine zweite Heimat und ist heute deren Aushängeschild.' },
  { cat: 'wine', keywords: ['tempranillo', 'rioja', 'spanien'], text: 'Tempranillo heißt „der Kleine Frühe" — die Trauben reifen ein bis zwei Wochen vor den meisten anderen spanischen Sorten.' },
  { cat: 'wine', keywords: ['nebbiolo', 'barolo', 'barbaresco'], text: 'Nebbiolo — die Rebsorte hinter Barolo und Barbaresco — hat ihren Namen vom italienischen „nebbia" (Nebel), weil die Trauben erst spät im nebligen Herbst reifen.' },
  { cat: 'wine', keywords: ['sangiovese', 'chianti', 'toskana'], text: 'Sangiovese bedeutet „Blut des Jupiter". Die Rebsorte macht über 70 % der Anbaufläche in der Toskana aus.' },

  // ── Gewürze ───────────────────────────────────────────────────────────────
  { cat: 'spice', keywords: ['pfeffer', 'pepper'], text: 'Schwarzer, weißer und grüner Pfeffer kommen von derselben Pflanze (Piper nigrum). Der Unterschied liegt im Reifezeitpunkt und der Verarbeitung.' },
  { cat: 'spice', keywords: ['safran', 'saffron'], text: 'Safran ist das teuerste Gewürz der Welt: Für 1 kg werden 150.000–200.000 Blütennarben von Hand geerntet — ca. 600 Stunden Arbeit.' },
  { cat: 'spice', keywords: ['vanille', 'vanilla'], text: 'Vanille ist nach Safran das zweitteuerste Gewürz der Welt. Echte Vanilleschoten werden vor der Reife geerntet und monatelang fermentiert.' },
  { cat: 'spice', keywords: ['zimt', 'cinnamon'], text: 'Ceylon-Zimt und Cassia-Zimt sind zwei verschiedene Pflanzen. Cassia (der häufigere) enthält deutlich mehr Cumarin, das in größeren Mengen leberschädigend wirken kann.' },
  { cat: 'spice', keywords: ['kurkuma', 'turmeric'], text: 'Kurkuma (Gelbwurz) wird seit über 4.000 Jahren in der ayurvedischen Medizin verwendet. Curcumin, der gelbe Farbstoff, wird 20× besser aufgenommen, wenn man Pfeffer dazugibt.' },
  { cat: 'spice', keywords: ['paprika'], text: 'Paprikapulver wurde erst im 16. Jahrhundert aus Amerika nach Europa gebracht. Ungarn machte es ab dem 19. Jahrhundert zum Nationalgewürz — als Ersatz für teuren Pfeffer.' },
  { cat: 'spice', keywords: ['muskat', 'nutmeg'], text: 'Muskatnuss und Macis kommen von derselben Frucht — die Nuss ist der Kern, Macis der rote Samenmantel. Muskatnuss war im 17. Jahrhundert wertvoller als Gold.' },
  { cat: 'spice', keywords: ['oregano'], text: 'Getrockneter Oregano ist tatsächlich aromatischer als frischer. Beim Trocknen konzentrieren sich die ätherischen Öle — das ist bei den meisten Kräutern umgekehrt.' },
  { cat: 'spice', keywords: ['rosmarin', 'rosemary'], text: 'Rosmarin enthält Rosmarinsäure und Carnosol — natürliche Antioxidantien, die so wirksam sind, dass sie industriell als Konservierungsmittel eingesetzt werden.' },
  { cat: 'spice', keywords: ['kreuzkümmel', 'cumin'], text: 'Kreuzkümmel (Cumin) ist nicht verwandt mit Kümmel, obwohl der Name es suggeriert. Er ist das am häufigsten verwendete Gewürz weltweit nach Pfeffer.' },
  { cat: 'spice', keywords: ['koriander', 'coriander'], text: 'Die Abneigung gegen Koriander ist genetisch bedingt — ein Geruchsrezeptor-Gen (OR6A2) lässt den Geschmack für 4–14 % der Menschen seifig wirken.' },
  { cat: 'spice', keywords: ['ingwer', 'ginger'], text: 'Ingwer enthält Gingerol, das beim Trocknen zu Shogaol wird — dem schärferen Verwandten. Getrockneter Ingwer ist deshalb schärfer als frischer.' },
  { cat: 'spice', keywords: ['chili', 'cayenne', 'habanero'], text: 'Die Schärfe von Chili wird in Scoville gemessen. Eine Jalapeño hat 2.500–8.000 SHU, eine Habanero bis 350.000 SHU, und Carolina Reaper über 2,2 Millionen.' },
  { cat: 'spice', keywords: ['basilikum', 'basil'], text: 'Basilikum verliert beim Kochen schnell sein Aroma. Deshalb wird es in der italienischen Küche meist erst zum Schluss frisch hinzugefügt.' },
  { cat: 'spice', keywords: ['thymian', 'thyme'], text: 'Thymian enthält Thymol — ein natürliches Antiseptikum, das bis ins 20. Jahrhundert als medizinisches Desinfektionsmittel verwendet wurde.' },
  { cat: 'spice', keywords: ['salz', 'salt', 'fleur de sel'], text: 'Fleur de Sel entsteht nur an windstillen, sonnigen Tagen — die oberste Kristallschicht wird von Hand abgeschöpft. Der Arbeitsaufwand macht es 100× teurer als Speisesalz.' },
  { cat: 'spice', keywords: ['kardamom', 'cardamom'], text: 'Kardamom ist das drittteuerste Gewürz der Welt (nach Safran und Vanille). In arabischen Ländern kommt er traditionell in den Kaffee — als Zeichen der Gastfreundschaft.' },
  { cat: 'spice', keywords: ['lorbeer', 'bay leaf'], text: 'Lorbeerblätter entfalten ihr Aroma erst ab 20 Minuten Kochzeit. Im alten Griechenland wurden sie als Siegeskranz verwendet — daher der „Lorbeerkranz".' },
  { cat: 'spice', keywords: ['nelke', 'clove'], text: 'Gewürznelken haben nichts mit der Blume Nelke zu tun. Der Name kommt vom altfranzösischen „clou" (Nagel) — wegen ihrer Form.' },
  { cat: 'spice', keywords: ['anis', 'sternanis'], text: 'Anis und Sternanis schmecken ähnlich, sind aber botanisch nicht verwandt. Sternanis kommt aus China und ist der Hauptgeschmack in Pho und Five Spice.' },

  // ── Lebensmittel & Kochen ─────────────────────────────────────────────────
  { cat: 'food', keywords: ['tiefkühl', 'einfrieren', 'frost'], text: 'Tiefgefrorenes Gemüse ist oft nährstoffreicher als „frisches" aus dem Supermarkt. Es wird direkt nach der Ernte schockgefrostet, während frisches Gemüse tagelang Vitamine verliert.' },
  { cat: 'food', keywords: ['olivenöl', 'olive'], text: '„Extra vergine" Olivenöl darf maximal 0,8 % freie Fettsäuren haben und muss kalt gepresst sein. Zum scharfen Anbraten ist es trotzdem geeignet — der Rauchpunkt liegt bei ca. 210 °C.' },
  { cat: 'food', keywords: ['haltbarkeit', 'mhd'], text: 'Das MHD ist kein Verfallsdatum, sondern eine Garantie des Herstellers. Viele Lebensmittel sind danach noch wochen- oder monatelang genießbar — Augen und Nase sind die besten Prüfer.' },
  { cat: 'food', keywords: ['honig', 'honey'], text: 'Honig wird praktisch nie schlecht. Archäologen haben in ägyptischen Gräbern 3.000 Jahre alten Honig gefunden — noch essbar.' },
  { cat: 'food', keywords: ['reis', 'rice'], text: 'Es gibt über 40.000 Reissorten weltweit. Basmati-Reis muss mindestens 12 Monate gelagert werden, bevor er verkauft werden darf — das verbessert Textur und Aroma.' },
  { cat: 'food', keywords: ['pasta', 'nudel'], text: 'Gute Pasta wird mit Bronzematrizen gepresst — die raue Oberfläche nimmt Sauce besser auf als glatte Industriepasta aus Teflonmatrizen.' },
  { cat: 'food', keywords: ['käse', 'cheese'], text: 'Parmigiano Reggiano muss mindestens 12 Monate reifen. Der „stravecchio" (extra alt) reift über 36 Monate — und wird dabei immer kristalliner durch das Tyrosin.' },
  { cat: 'food', keywords: ['schokolade', 'kakao'], text: 'Schokolade enthält über 600 verschiedene Aromastoffe — mehr als Wein. Professionelle Schokoladenverkostung funktioniert ähnlich wie eine Weinprobe.' },
  { cat: 'food', keywords: ['tomate'], text: 'Tomaten sollten nie im Kühlschrank gelagert werden. Unter 12 °C stoppen die Enzyme, die für den Geschmack verantwortlich sind — sie werden mehlig und fade.' },
  { cat: 'food', keywords: ['brot', 'sauerteig'], text: 'Ein Sauerteig enthält bis zu 50 verschiedene Bakterien- und Hefearten. Die Milchsäurebakterien machen das Brot haltbarer und leichter verdaulich als reine Hefe.' },
  { cat: 'food', keywords: ['essig', 'balsamico'], text: 'Echter „Aceto Balsamico Tradizionale" reift mindestens 12 Jahre in einer Batterie aus 5 verschiedenen Holzfässern. Eine 100-ml-Flasche kostet 40–200 €.' },
  { cat: 'food', keywords: ['kaffee', 'coffee'], text: 'Kaffeebohnen sind eigentlich die Kerne einer Kirsche. Eine Kaffeepflanze produziert pro Jahr nur genug Kirschen für ca. 500 g gerösteten Kaffee.' },
  { cat: 'food', keywords: ['butter'], text: 'Gesalzene Butter wurde ursprünglich erfunden, um sie haltbar zu machen — nicht wegen des Geschmacks. Französische Küche bevorzugt bis heute ungesalzene Butter für mehr Kontrolle.' },

  // ── Allgemein (kein Bestandsbezug nötig) ──────────────────────────────────
  { cat: 'general', keywords: [], text: 'Wein und Käse passen nicht immer zusammen. Gerbstoffreiche Rotweine können mit fettem Käse kollidieren. Besser: Weißwein zu Hartkäse, Süßwein zu Blauschimmel.' },
  { cat: 'general', keywords: [], text: 'Die perfekte Lagertemperatur für Wein ist 10–14 °C. Jedes Grad über 20 °C beschleunigt die Alterung dramatisch — ein Sommer im warmen Keller kann Jahre kosten.' },
  { cat: 'general', keywords: [], text: 'Gewürze verlieren nach dem Mahlen schnell ihr Aroma — nach 6 Monaten oft schon die Hälfte. Ganze Gewürze halten sich hingegen 2–4 Jahre.' },
  { cat: 'general', keywords: [], text: 'Umami ist der „fünfte Geschmack" — entdeckt 1908 vom japanischen Chemiker Kikunae Ikeda in Kombu-Algen. Parmesan, Tomaten und Sojasauce sind besonders umami-reich.' },
  { cat: 'general', keywords: [], text: 'Professionelle Weinverkoster spucken den Wein aus — nicht aus Snobismus, sondern weil Alkohol die Geschmacksknospen betäubt. So können sie über 100 Weine am Tag beurteilen.' },
  { cat: 'general', keywords: [], text: 'Die Maillard-Reaktion (Bräunung) passiert ab 140 °C und erzeugt über 1.000 verschiedene Aromastoffe. Deshalb schmeckt gebratenes Fleisch so anders als gekochtes.' },
  { cat: 'general', keywords: [], text: 'In Frankreich gibt es über 400 verschiedene Käsesorten — de Gaulle soll gesagt haben: „Wie soll man ein Land regieren, das 246 Sorten Käse hat?" (er hat untertrieben).' },
  { cat: 'general', keywords: [], text: 'Weißer und brauner Zucker unterscheiden sich kaum im Geschmack. Der Unterschied: brauner Zucker enthält noch etwas Melasse. „Rohrzucker" kann auch aus Rüben sein — die Pflanze ist egal.' },
  { cat: 'general', keywords: [], text: 'Capsaicin, der Scharfstoff in Chilis, ist fettlöslich. Deshalb hilft Milch besser gegen Schärfe als Wasser — das Casein bindet das Capsaicin.' },
  { cat: 'general', keywords: [], text: 'Der weltweite Weinverbrauch sinkt seit Jahren, aber die Nachfrage nach Premium-Weinen steigt. Menschen trinken weniger, dafür besser.' },
  { cat: 'general', keywords: [], text: 'Das Glas beeinflusst den Weingeschmack messbar. Ein bauchiges Glas sammelt Aromen, ein schmales konzentriert die Säure. Deshalb gibt es für jede Rebsorte ein optimales Glas.' },
  { cat: 'general', keywords: [], text: 'Meersalz, Himalaya-Salz und Steinsalz sind chemisch fast identisch — zu über 97 % Natriumchlorid. Die Spurenelemente machen den Geschmack, sind aber ernährungsphysiologisch irrelevant.' },
  { cat: 'general', keywords: [], text: 'Beim Kochen mit Wein verdunstet der Alkohol nicht sofort. Nach 15 Minuten Kochen sind noch ca. 40 % des Alkohols übrig, nach einer Stunde noch ca. 25 %.' },
  { cat: 'general', keywords: [], text: 'Bienen müssen für 1 kg Honig etwa 3 Millionen Blüten besuchen und legen dabei rund 100.000 km zurück — mehr als zweimal um die Erde.' },
  { cat: 'general', keywords: [], text: 'Die älteste bekannte Weinflasche (Römerwein von Speyer, ca. 325 n. Chr.) steht im Historischen Museum der Pfalz. Sie wurde nie geöffnet.' },
  { cat: 'general', keywords: [], text: 'Scharfes Essen ist kein Geschmack, sondern ein Schmerzsignal. Capsaicin aktiviert den TRPV1-Rezeptor — denselben, der auch auf Hitze reagiert.' },
  { cat: 'general', keywords: [], text: 'Teures Olivenöl lohnt sich — aber nur kalt. Zum Anbraten kann man ruhig günstigeres verwenden, da die feinen Aromen bei hoher Hitze sowieso verschwinden.' },
  { cat: 'general', keywords: [], text: 'Pasta-Wasser ist flüssiges Gold: Die gelöste Stärke emulgiert Saucen cremig. Einen Schöpflöffel vor dem Abgießen aufheben und zur Sauce geben.' },
  { cat: 'general', keywords: [], text: 'Trüffel kann man nicht kultivieren — sie wachsen in Symbiose mit Baumwurzeln und werden von Hunden (früher Schweinen) aufgespürt. Weiße Alba-Trüffel kosten bis zu 9.000 €/kg.' },
]

export default FACTS

export function getDailyFact(dayOfYear) {
  return FACTS[dayOfYear % FACTS.length]
}

export function getPersonalizedFact(dayOfYear, inventory) {
  const baseFact = FACTS[dayOfYear % FACTS.length]

  const inventoryTerms = [
    ...inventory.wineNames,
    ...inventory.grapes,
    ...inventory.spiceNames,
  ].map(s => s.toLowerCase())

  if (inventoryTerms.length === 0) return baseFact

  const personalFacts = FACTS.filter(f =>
    f.keywords.length > 0 &&
    f.keywords.some(kw => inventoryTerms.some(t => t.includes(kw)))
  )

  if (personalFacts.length === 0) return baseFact

  return personalFacts[dayOfYear % personalFacts.length]
}
