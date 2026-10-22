// Angebots-Merkliste: Produkte, die wir nur im Angebot kaufen wollen
import { create } from 'zustand'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'
import { synced } from '../../lib/sync'
import { localISODate } from '../../utils/date'

function uid() { return 'pw_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36) }
const num = v => (v == null || v === '' ? null : Number(v))

function toJS(row) {
  return {
    id: row.id,
    name: row.name,
    searchTerm: row.search_term || '',
    targetPrice: num(row.target_price),
    offerPrice: num(row.offer_price),
    offerStore: row.offer_store || '',
    offerUntil: row.offer_until || '',
    bestPrice: num(row.best_price),
    bestStore: row.best_store || '',
    checkedAt: row.checked_at || null,
    sortOrder: row.sort_order ?? 0,
  }
}

// Suchbegriff fürs Prospekt-Portal: eigener Begriff, sonst das erste Wort (meist die Marke)
export function defaultSearchTerm(name) { return (name || '').trim().split(/\s+/)[0] || '' }
export function searchTermOf(w) { return w.searchTerm?.trim() || defaultSearchTerm(w.name) }

export const DEAL_SOURCES = [
  { id: 'marktguru', label: 'marktguru', url: q => `https://www.marktguru.de/search/${encodeURIComponent(q)}` },
  { id: 'kaufda',    label: 'kaufDA',    url: q => `https://www.kaufda.de/search?query=${encodeURIComponent(q)}` },
]

// Angebot noch gültig?
export function activeOffer(w, today = localISODate()) {
  if (w.offerPrice == null) return null
  if (w.offerUntil && w.offerUntil < today) return null
  return { price: w.offerPrice, store: w.offerStore, until: w.offerUntil }
}

export function isGoodDeal(w) {
  const o = activeOffer(w)
  return !!o && (w.targetPrice == null || o.price <= w.targetPrice)
}

export const useDeals = create((set, get) => ({
  watches: [],

  async _loadFromSupabase(householdId) {
    const { data, error } = await supabase.from('price_watch').select('*').eq('household_id', householdId).order('sort_order')
    if (error) { console.warn('price_watch:', error.message); return }
    set({ watches: (data ?? []).map(toJS) })
  },

  addWatch({ name, searchTerm = '', targetPrice = null }) {
    const h = useStore.getState().household
    if (!h || !name.trim()) return
    const w = { id: uid(), name: name.trim(), searchTerm: searchTerm.trim(), targetPrice: num(targetPrice),
      offerPrice: null, offerStore: '', offerUntil: '', bestPrice: null, bestStore: '', checkedAt: null,
      sortOrder: get().watches.length }
    set(s => ({ watches: [...s.watches, w] }))
    supabase.from('price_watch').insert([{
      id: w.id, household_id: h.id, name: w.name, search_term: w.searchTerm,
      target_price: w.targetPrice, sort_order: w.sortOrder,
    }]).then(...synced('addWatch'))
    return w.id
  },

  updateWatch(id, { name, searchTerm, targetPrice }) {
    const patch = {}
    if (name !== undefined) patch.name = name.trim()
    if (searchTerm !== undefined) patch.search_term = searchTerm.trim()
    if (targetPrice !== undefined) patch.target_price = num(targetPrice)
    set(s => ({ watches: s.watches.map(w => w.id === id ? toJS({ ...toDB(w), ...patch, id }) : w) }))
    supabase.from('price_watch').update(patch).eq('id', id).then(...synced('updateWatch'))
  },

  // Ergebnis einer Prüfung: Angebot gefunden (price/store/until) oder keins (null)
  recordCheck(id, offer) {
    const w = get().watches.find(x => x.id === id)
    if (!w) return
    const patch = { checked_at: new Date().toISOString() }
    if (offer) {
      patch.offer_price = num(offer.price)
      patch.offer_store = (offer.store || '').trim()
      patch.offer_until = offer.until || null
      if (w.bestPrice == null || patch.offer_price < w.bestPrice) {
        patch.best_price = patch.offer_price
        patch.best_store = patch.offer_store
      }
    } else {
      patch.offer_price = null; patch.offer_store = ''; patch.offer_until = null
    }
    set(s => ({ watches: s.watches.map(x => x.id === id ? toJS({ ...toDB(x), ...patch, id }) : x) }))
    supabase.from('price_watch').update(patch).eq('id', id).then(...synced('recordCheck'))
  },

  removeWatch(id) {
    set(s => ({ watches: s.watches.filter(w => w.id !== id) }))
    supabase.from('price_watch').delete().eq('id', id).then(...synced('removeWatch'))
  },
}))

function toDB(w) {
  return {
    name: w.name, search_term: w.searchTerm, target_price: w.targetPrice,
    offer_price: w.offerPrice, offer_store: w.offerStore, offer_until: w.offerUntil || null,
    best_price: w.bestPrice, best_store: w.bestStore, checked_at: w.checkedAt, sort_order: w.sortOrder,
  }
}
