import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'

function logActivity(action, target, detail) {
  try { useStore.getState()._logActivity(action, target, detail) } catch {}
}
function getHousehold() { return useStore.getState().household }

export const CATEGORIES = [
  { id: 'mehl',       label: 'Mehl',             emoji: '🌾' },
  { id: 'zucker',     label: 'Zucker',           emoji: '🍬' },
  { id: 'reis',       label: 'Reis',             emoji: '🍚' },
  { id: 'nudeln',     label: 'Nudeln/Pasta',     emoji: '🍝' },
  { id: 'müsli',      label: 'Müsli/Cerealien',  emoji: '🥣' },
  { id: 'backen',     label: 'Backzutaten',      emoji: '🧁' },
  { id: 'hülsen',     label: 'Hülsenfrüchte',    emoji: '🫘' },
  { id: 'nüsse',      label: 'Nüsse/Kerne',      emoji: '🥜' },
  { id: 'getrocknetes', label: 'Trockenfrüchte', emoji: '🍇' },
  { id: 'konserven',  label: 'Konserven',        emoji: '🥫' },
  { id: 'öl',         label: 'Öl/Essig',         emoji: '🫒' },
  { id: 'sauce',      label: 'Sauce/Dressing',   emoji: '🥫' },
  { id: 'getränk',    label: 'Getränke',         emoji: '🥤' },
  { id: 'snack',      label: 'Snacks',           emoji: '🍪' },
  { id: 'tierfutter', label: 'Tierfutter',       emoji: '🐶' },
  { id: 'sonstiges',  label: 'Sonstiges',        emoji: '📦' },
]

const KEYWORD_CAT = [
  ['mehl|grieß|stärke|speisestärke|dinkel|roggen|weizen', 'mehl'],
  ['zucker|puderzucker|gelierzucker|vanillezucker|honig|sirup|agave', 'zucker'],
  ['reis|basmat|jasmin|risotto|milchreis', 'reis'],
  ['nudel|pasta|spaghet|penne|fusilli|makkaroni|tortellini|lasagne', 'nudeln'],
  ['müsli|haferflock|cornflakes|cereal|granola|porridge', 'müsli'],
  ['back|hefe|natron|vanille|kakao|schokolade|kuvertüre|gelatine|mandel', 'backen'],
  ['linse|bohne|kichererbse|erbse|hülsen', 'hülsen'],
  ['nuss|nüsse|mandel|cashew|walnuss|haselnuss|pistazie|kürbiskern|sonnenblumenkern|leinsamen|chia|sesam', 'nüsse'],
  ['rosine|dattel|feige|cranberry|aprikose|trocken', 'getrocknetes'],
  ['konserve|dose|tomate|mais|thunfisch|sardine|pilz|sauerkraut', 'konserven'],
  ['öl|olivenöl|rapsöl|essig|balsamico|sonnenblumen', 'öl'],
  ['sauce|ketchup|senf|mayo|soja|dressing|worcester|tabasco', 'sauce'],
  ['saft|wasser|tee|kaffee|kakao|limo|cola|brause', 'getränk'],
  ['chips|cracker|keks|riegel|popcorn|salzstange|brezel', 'snack'],
  ['hund|katze|futter|barf|leckerli', 'tierfutter'],
]

export function autoCategory(name) {
  const n = (name || '').toLowerCase()
  for (const [re, cat] of KEYWORD_CAT) if (new RegExp(re).test(n)) return cat
  return 'sonstiges'
}

function uid(p = 'pt') { return p + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36) }
function today() { return new Date().toISOString().slice(0, 10) }

function locationToJS(row) {
  return {
    id: row.id,
    label: row.label,
    emoji: row.emoji ?? '📦',
    shelves: row.shelves ?? [],
    sortOrder: row.sort_order ?? 0,
  }
}

function itemToJS(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? 'sonstiges',
    locationId: row.location_id ?? '',
    shelfId: row.shelf_id ?? '',
    quantity: row.quantity ?? 1,
    unit: row.unit ?? 'Stück',
    bestBefore: row.best_before ?? '',
    openedAt: row.opened_at ?? '',
    photoData: row.photo_data ?? null,
    barcode: row.barcode ?? '',
    note: row.note ?? '',
    needsRestock: row.needs_restock ?? false,
  }
}

function itemToDB(data) {
  return {
    name: data.name,
    category: data.category ?? 'sonstiges',
    location_id: data.locationId ?? null,
    shelf_id: data.shelfId ?? null,
    quantity: data.quantity ?? 1,
    unit: data.unit ?? 'Stück',
    best_before: data.bestBefore || null,
    opened_at: data.openedAt || null,
    photo_data: data.photoData ?? null,
    barcode: data.barcode ?? '',
    note: data.note ?? '',
    needs_restock: data.needsRestock ?? false,
  }
}

export const usePantry = create(
  persist(
    (set, get) => ({
      locations: [],
      items: [],
      setupDone: false,
      formOpen: false,
      formPrefill: null,
      _loaded: false,

      completeSetup() {
        set({ setupDone: true })
        if (!get().locations.length) get().addLocation('Vorratsschrank', '📦')
        supabase.auth.updateUser({ data: { pantry_setup_done: true } })
      },
      restartSetup() {
        set({ setupDone: false })
        supabase.auth.updateUser({ data: { pantry_setup_done: false } })
      },

      openForm(prefill = null) { set({ formOpen: true, formPrefill: prefill }) },
      closeForm() { set({ formOpen: false, formPrefill: null }) },

      async _loadFromSupabase(householdId) {
        const [{ data: locData }, { data: itemsData }] = await Promise.all([
          supabase.from('pantry_locations').select('*').eq('household_id', householdId).order('sort_order'),
          supabase.from('pantry_items').select('*').eq('household_id', householdId).order('name'),
        ])
        const locations = (locData ?? []).map(locationToJS)
        const items = (itemsData ?? []).map(itemToJS)
        const patch = { locations, items, _loaded: true }
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.pantry_setup_done || locations.length > 0 || items.length > 0) {
          patch.setupDone = true
        }
        set(patch)
        return { locations, items }
      },

      // ── Location-Verwaltung ──────────────────────────────────────────────
      addLocation(label, emoji = '📦') {
        const h = getHousehold()
        const loc = { id: uid('l'), label, emoji, shelves: [{ id: uid('sh'), label: 'Fach 1' }] }
        set(s => ({ locations: [...s.locations, { ...loc, sortOrder: s.locations.length }] }))
        if (h) supabase.from('pantry_locations').insert([{
          id: loc.id, household_id: h.id, label, emoji, shelves: loc.shelves, sort_order: get().locations.length - 1,
        }]).then(({ error }) => { if (error) console.error('addLocation:', error) })
        return loc.id
      },
      renameLocation(id, label, emoji) {
        set(s => ({ locations: s.locations.map(l => l.id === id ? { ...l, label, emoji: emoji ?? l.emoji } : l) }))
        const patch = { label }
        if (emoji) patch.emoji = emoji
        supabase.from('pantry_locations').update(patch).eq('id', id).then(() => {})
      },
      reorderLocations(reordered) {
        const updated = reordered.map((l, i) => ({ ...l, sortOrder: i }))
        set({ locations: updated })
        Promise.all(updated.map(l =>
          supabase.from('pantry_locations').update({ sort_order: l.sortOrder }).eq('id', l.id)
        )).catch(e => console.error('reorderLocations:', e))
      },
      removeLocation(id) {
        set(s => ({
          locations: s.locations.filter(l => l.id !== id),
          items: s.items.filter(it => it.locationId !== id),
        }))
        supabase.from('pantry_locations').delete().eq('id', id).then(() => {})
        supabase.from('pantry_items').delete().eq('location_id', id).then(() => {})
      },
      addShelf(locationId, label) {
        const newShelf = { id: uid('sh'), label }
        set(s => ({
          locations: s.locations.map(l => l.id === locationId
            ? { ...l, shelves: [...l.shelves, newShelf] } : l)
        }))
        const loc = get().locations.find(l => l.id === locationId)
        if (loc) supabase.from('pantry_locations').update({ shelves: loc.shelves }).eq('id', locationId).then(() => {})
      },
      renameShelf(locationId, shelfId, label) {
        set(s => ({
          locations: s.locations.map(l => l.id === locationId
            ? { ...l, shelves: l.shelves.map(sh => sh.id === shelfId ? { ...sh, label } : sh) } : l)
        }))
        const loc = get().locations.find(l => l.id === locationId)
        if (loc) supabase.from('pantry_locations').update({ shelves: loc.shelves }).eq('id', locationId).then(() => {})
      },
      removeShelf(locationId, shelfId) {
        set(s => ({
          locations: s.locations.map(l => l.id === locationId
            ? { ...l, shelves: l.shelves.filter(sh => sh.id !== shelfId) } : l),
          items: s.items.filter(it => !(it.locationId === locationId && it.shelfId === shelfId)),
        }))
        const loc = get().locations.find(l => l.id === locationId)
        if (loc) supabase.from('pantry_locations').update({ shelves: loc.shelves }).eq('id', locationId).then(() => {})
        supabase.from('pantry_items').delete().eq('location_id', locationId).eq('shelf_id', shelfId).then(() => {})
      },

      // ── Items ────────────────────────────────────────────────────────────
      addItem(data) {
        const h = getHousehold()
        const category = data.category || autoCategory(data.name)
        const item = {
          id: uid('i'),
          name: data.name.trim(),
          category,
          locationId: data.locationId || '',
          shelfId: data.shelfId || '',
          quantity: Math.max(1, Number(data.quantity) || 1),
          unit: data.unit || 'Stück',
          bestBefore: data.bestBefore || '',
          openedAt: data.openedAt || '',
          note: data.note || '',
          photoData: data.photoData || null,
          barcode: data.barcode || '',
          needsRestock: false,
        }
        set(s => ({ items: [...s.items, item] }))
        if (h) supabase.from('pantry_items').insert([{ id: item.id, household_id: h.id, ...itemToDB(item) }])
          .then(({ error }) => {
            if (error) {
              console.error('addItem:', error)
              set(s => ({ items: s.items.filter(it => it.id !== item.id) }))
            }
          })
        logActivity('pantry_added', item.name, `${item.quantity}× ${item.unit}`)
        return item.id
      },

      updateItem(id, patch) {
        set(s => ({ items: s.items.map(it => it.id === id ? { ...it, ...patch } : it) }))
        const dbPatch = {}
        if ('name' in patch) dbPatch.name = patch.name
        if ('category' in patch) dbPatch.category = patch.category
        if ('locationId' in patch) dbPatch.location_id = patch.locationId
        if ('shelfId' in patch) dbPatch.shelf_id = patch.shelfId
        if ('quantity' in patch) dbPatch.quantity = patch.quantity
        if ('unit' in patch) dbPatch.unit = patch.unit
        if ('bestBefore' in patch) dbPatch.best_before = patch.bestBefore
        if ('openedAt' in patch) dbPatch.opened_at = patch.openedAt
        if ('note' in patch) dbPatch.note = patch.note
        if ('photoData' in patch) dbPatch.photo_data = patch.photoData
        if ('barcode' in patch) dbPatch.barcode = patch.barcode
        if ('needsRestock' in patch) dbPatch.needs_restock = patch.needsRestock
        if (Object.keys(dbPatch).length) supabase.from('pantry_items').update(dbPatch).eq('id', id).then(() => {})
      },

      removeItem(id) {
        const item = get().items.find(it => it.id === id)
        set(s => ({ items: s.items.filter(it => it.id !== id) }))
        supabase.from('pantry_items').delete().eq('id', id).then(() => {})
        if (item) logActivity('pantry_deleted', item.name)
      },

      bulkDeleteItems(ids) {
        if (!ids.length) return
        set(s => ({ items: s.items.filter(it => !ids.includes(it.id)) }))
        supabase.from('pantry_items').delete().in('id', ids).then(() => {})
        logActivity('pantry_deleted', `${ids.length} Einträge gelöscht`)
      },

      toggleRestock(id) {
        const item = get().items.find(it => it.id === id)
        const val = !item?.needsRestock
        set(s => ({ items: s.items.map(it => it.id === id ? { ...it, needsRestock: val } : it) }))
        supabase.from('pantry_items').update({ needs_restock: val }).eq('id', id).then(() => {})
      },

      clearAllItems() {
        const h = getHousehold()
        const count = get().items.length
        if (!count) return
        set({ items: [] })
        if (h) supabase.from('pantry_items').delete().eq('household_id', h.id).then(() => {})
        logActivity('pantry_deleted', `Alle ${count} Einträge gelöscht`)
      },

      resetSetup() {
        const h = getHousehold()
        set({ locations: [], items: [], setupDone: false })
        supabase.auth.updateUser({ data: { pantry_setup_done: false } })
        if (h) {
          supabase.from('pantry_items').delete().eq('household_id', h.id).then(() => {})
          supabase.from('pantry_locations').delete().eq('household_id', h.id).then(() => {})
        }
      },
    }),
    {
      name: 'haushalt-pantry-local-ui',
      partialize: () => ({}),
    }
  )
)
