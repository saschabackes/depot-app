// Fehlende Zutaten für die Einkaufsliste: jede nur einmal, ohne das, was schon draufsteht
// (offene Einträge der eingebauten Liste und Bring!-Einträge, ohne Groß-/Kleinschreibung).
// Gemeinsame Regel für Rezeptdetail und Wochenplan.
export function namesToBuy(missing, shoppingItems, bringItems) {
  const onList = new Set([
    ...shoppingItems.filter(i => !i.checked).map(i => i.name),
    ...bringItems.map(i => i.name),
  ].map(n => n.trim().toLowerCase()))
  const wanted = new Map()
  missing.forEach(name => {
    const key = name.trim().toLowerCase()
    if (!wanted.has(key) && !onList.has(key)) wanted.set(key, name)
  })
  return [...wanted.values()]
}
