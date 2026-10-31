import { create } from 'zustand'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'
import { synced, reportSyncError } from '../../lib/sync'
import { localISODate } from '../../utils/date'
import { consistentPatch } from './logic'

function getHousehold() { return useStore.getState().household }
function uid(p = 'po') { return p + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36) }

const BUCKET = 'post'

// ── Zeilen ↔ Objekte ─────────────────────────────────────────────────────────

function personToJS(r) {
  return { id: r.id, name: r.name, insurance: r.insurance ?? 'keine', sortOrder: r.sort_order ?? 0 }
}

function itemToJS(r) {
  return {
    id: r.id,
    kind: r.kind ?? null,
    reviewed: r.reviewed ?? false,
    sender: r.sender ?? '',
    title: r.title ?? '',
    note: r.note ?? '',
    personId: r.person_id ?? '',
    receivedOn: r.received_on ?? '',
    invoiceDate: r.invoice_date ?? '',
    dueDate: r.due_date ?? '',
    amountCents: r.amount_cents ?? null,
    iban: r.iban ?? '',
    reference: r.reference ?? '',
    relatedId: r.related_id ?? '',
    originalLocation: r.original_location ?? '',
    payStatus: r.pay_status ?? 'offen',
    paidOn: r.paid_on ?? '',
    reimbStatus: r.reimb_status ?? null,
    submittedOn: r.submitted_on ?? '',
    reimbursedOn: r.reimbursed_on ?? '',
    reimbursedCents: r.reimbursed_cents ?? null,
    archivedAt: r.archived_at ?? null,
    createdAt: r.created_at ?? '',
  }
}

function pageToJS(r) {
  return { id: r.id, itemId: r.item_id, path: r.path, sortOrder: r.sort_order ?? 0, suggested: r.suggested ?? null }
}

const COLUMN = {
  kind: 'kind', reviewed: 'reviewed', sender: 'sender', title: 'title', note: 'note',
  personId: 'person_id', receivedOn: 'received_on', invoiceDate: 'invoice_date', dueDate: 'due_date',
  amountCents: 'amount_cents', iban: 'iban', reference: 'reference', relatedId: 'related_id',
  originalLocation: 'original_location', payStatus: 'pay_status', paidOn: 'paid_on',
  reimbStatus: 'reimb_status', submittedOn: 'submitted_on', reimbursedOn: 'reimbursed_on',
  reimbursedCents: 'reimbursed_cents', archivedAt: 'archived_at',
}
// Diese Spalten sind in der Datenbank leer = null, im Formular leer = ''
const NULLABLE = new Set(['kind', 'person_id', 'invoice_date', 'due_date', 'amount_cents', 'related_id',
  'paid_on', 'reimb_status', 'submitted_on', 'reimbursed_on', 'reimbursed_cents', 'archived_at'])

function itemToDB(patch) {
  const out = {}
  for (const [key, value] of Object.entries(patch)) {
    const col = COLUMN[key]
    if (!col) continue
    out[col] = NULLABLE.has(col) && value === '' ? null : value
  }
  return out
}

// ── Dateien ──────────────────────────────────────────────────────────────────

const urlCache = new Map()

// Kurzlebiger Link auf ein Foto (die Fotos sind nicht öffentlich)
export async function getPageUrl(path) {
  const hit = urlCache.get(path)
  if (hit && hit.expires > Date.now()) return hit.url
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) return null
  urlCache.set(path, { url: data.signedUrl, expires: Date.now() + 50 * 60 * 1000 })
  return data.signedUrl
}

// ── Store ────────────────────────────────────────────────────────────────────

export const usePost = create((set, get) => ({
  persons: [],
  items: [],
  pages: [],
  _loaded: false,

  async _loadFromSupabase(householdId) {
    const results = await Promise.all([
      supabase.from('post_persons').select('*').eq('household_id', householdId).order('sort_order'),
      supabase.from('post_items').select('*').eq('household_id', householdId).order('created_at', { ascending: false }),
      // ocr_text bleibt auf dem Server: wird für die Anzeige nicht gebraucht
      supabase.from('post_pages').select('id,item_id,path,sort_order,suggested').eq('household_id', householdId).order('sort_order'),
    ])
    // Wie Wochenplan und Preisbeobachtung: fehlt die Tabelle (Migration noch nicht eingespielt), lädt der Rest der App trotzdem
    const failed = results.find(r => r.error)
    if (failed) { console.warn('post:', failed.error.message); return }
    const [{ data: persons }, { data: items }, { data: pages }] = results
    set({
      persons: (persons ?? []).map(personToJS),
      items: (items ?? []).map(itemToJS),
      pages: (pages ?? []).map(pageToJS),
      _loaded: true,
    })
  },

  // ── Personen ───────────────────────────────────────────────────────────────
  addPerson(name, insurance = 'keine') {
    const h = getHousehold()
    const person = { id: uid('pp'), name: name.trim(), insurance, sortOrder: get().persons.length }
    set(s => ({ persons: [...s.persons, person] }))
    if (h) supabase.from('post_persons').insert([{
      id: person.id, household_id: h.id, name: person.name, insurance, sort_order: person.sortOrder,
    }]).then(...synced('post_persons'))
    return person.id
  },
  updatePerson(id, patch) {
    set(s => ({ persons: s.persons.map(p => p.id === id ? { ...p, ...patch } : p) }))
    const row = {}
    if (patch.name !== undefined) row.name = patch.name.trim()
    if (patch.insurance !== undefined) row.insurance = patch.insurance
    supabase.from('post_persons').update(row).eq('id', id).then(...synced('post_persons'))
    // Wechselt die Versicherung, passt sich die Erstattungsspur der Vorgänge an
    for (const item of get().items) if (item.personId === id) get().updateItem(item.id, {})
  },
  removePerson(id) {
    set(s => ({
      persons: s.persons.filter(p => p.id !== id),
      items: s.items.map(it => it.personId === id ? { ...it, personId: '' } : it),
    }))
    supabase.from('post_persons').delete().eq('id', id).then(...synced('post_persons'))
    for (const item of get().items) if (item.personId === '' && item.kind === 'arztrechnung') get().updateItem(item.id, {})
  },

  // ── Vorgänge ───────────────────────────────────────────────────────────────
  // Legt den Vorgang an und lädt die Fotos hoch. Wirft bei Fehlern; was bis dahin gespeichert ist, bleibt erhalten.
  async captureItem(blobs) {
    const h = getHousehold()
    if (!h) throw new Error('Kein Haushalt geladen.')
    const today = localISODate()
    const item = itemToJS({ id: uid(), reviewed: false, received_on: today, pay_status: 'offen', created_at: new Date().toISOString() })
    const { error } = await supabase.from('post_items').insert([{
      id: item.id, household_id: h.id, reviewed: false, received_on: today, pay_status: 'offen',
    }])
    if (error) { reportSyncError('post_items', error); throw error }
    set(s => ({ items: [item, ...s.items] }))
    try {
      await get().addPages(item.id, blobs)
    } catch (e) {
      e.itemId = item.id   // der Vorgang existiert bereits, nur Seiten fehlen
      throw e
    }
    return item.id
  },

  async addPages(itemId, blobs) {
    const h = getHousehold()
    if (!h) throw new Error('Kein Haushalt geladen.')
    const start = get().pages.filter(p => p.itemId === itemId).length
    for (let i = 0; i < blobs.length; i++) {
      const path = `${h.id}/${itemId}/${Date.now().toString(36)}-${i}.jpg`
      const up = await supabase.storage.from(BUCKET).upload(path, blobs[i], { contentType: 'image/jpeg' })
      if (up.error) { reportSyncError('post_upload', up.error); throw up.error }
      const page = { id: uid('pg'), itemId, path, sortOrder: start + i, suggested: null }
      const ins = await supabase.from('post_pages').insert([{
        id: page.id, household_id: h.id, item_id: itemId, path, sort_order: page.sortOrder,
      }])
      if (ins.error) {
        supabase.storage.from(BUCKET).remove([path])
        reportSyncError('post_pages', ins.error)
        throw ins.error
      }
      set(s => ({ pages: [...s.pages, page] }))
    }
  },

  removePage(pageId) {
    const page = get().pages.find(p => p.id === pageId)
    if (!page) return
    set(s => ({ pages: s.pages.filter(p => p.id !== pageId) }))
    supabase.from('post_pages').delete().eq('id', pageId).then(...synced('post_pages'))
    supabase.storage.from(BUCKET).remove([page.path])
  },

  updateItem(id, patch) {
    const item = get().items.find(i => i.id === id)
    if (!item) return
    const { persons } = get()
    const full = { ...patch, ...consistentPatch({ ...item, ...patch }, persons) }
    set(s => ({ items: s.items.map(i => i.id === id ? { ...i, ...full } : i) }))
    if (Object.keys(full).length === 0) return
    supabase.from('post_items').update(itemToDB(full)).eq('id', id).then(...synced('post_items'))
  },

  markPaid(id, date = localISODate()) { get().updateItem(id, { payStatus: 'bezahlt', paidOn: date }) },
  markUnpaid(id) { get().updateItem(id, { payStatus: 'offen', paidOn: '' }) },

  submitMany(ids, date = localISODate()) {
    for (const id of ids) get().updateItem(id, { reimbStatus: 'eingereicht', submittedOn: date })
  },

  removeItem(id) {
    const paths = get().pages.filter(p => p.itemId === id).map(p => p.path)
    set(s => ({
      items: s.items.filter(i => i.id !== id),
      pages: s.pages.filter(p => p.itemId !== id),
    }))
    supabase.from('post_items').delete().eq('id', id).then(...synced('post_items'))
    if (paths.length) supabase.storage.from(BUCKET).remove(paths)
  },
}))
