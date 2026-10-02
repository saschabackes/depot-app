// Nur Entwicklung: `?demo` ersetzt Supabase durch eine Datenbank im Arbeitsspeicher,
// damit sich die App ohne Login und ohne echte Daten bedienen lässt.

const HID = '00000000-0000-4000-8000-000000000001'
const UID = '00000000-0000-4000-8000-0000000000aa'
const now = new Date().toISOString()
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }

const user = {
  id: UID,
  email: 'demo@depot.local',
  email_confirmed_at: now,
  user_metadata: {
    name: 'Demo',
    onboarding_done: true,
    freezer_setup_done: true,
    cellar_setup_done: true,
    pantry_setup_done: true,
  },
}

const spice = (id, name, brand, loc, expiry, fill, form = 'gemahlen', pkg = 'fertigstreuer', grams = 35) => ({
  id, name, brand, image_url: null, packaging_type: pkg, amount_grams: grams, units: 1,
  expiry_date: expiry, barcode: null, notes: null, location_id: loc, category: null,
  fill_level: fill, form, disposed_at: null, disposal_reason: '', household_id: HID, created_at: now, updated_at: now,
})

function seed() {
  return {
    households: [{ id: HID, name: 'Demo-Haushalt', invite_code: 'DEMO2345', created_by: UID, created_at: now }],
    household_members: [{ household_id: HID, user_id: UID, role: 'owner', joined_at: now }],
    storage_locations: [
      { id: 'loc1', name: 'Küchenschrank', description: '', sort_order: 0, household_id: HID, created_at: now },
      { id: 'loc2', name: 'Gewürzschublade', description: '', sort_order: 1, household_id: HID, created_at: now },
    ],
    spice_categories: [],
    spices: [
      spice('sp1', 'Paprika edelsüß', 'Ostmann', 'loc1', day(240), 3),
      spice('sp2', 'Kreuzkümmel', 'Ostmann', 'loc1', day(-90), 2),
      spice('sp3', 'Koriander', 'Edora', 'loc1', day(20), 1),
      spice('sp4', 'Zimt', 'Fuchs', 'loc2', day(400), 4),
      spice('sp5', 'Oregano', 'Fuchs', 'loc2', day(150), 2, 'gerebelt'),
      spice('sp6', 'Muskatnuss', 'Edora', 'loc2', day(700), 4, 'ganz', 'nachfuell', 50),
      spice('sp7', 'Currypulver', 'Ostmann', 'loc1', day(-10), 1),
    ],
    shopping_items: [
      { id: 'sh1', name: 'Milch', amount: '2 l', checked: false, household_id: HID, created_at: now },
      { id: 'sh2', name: 'Tomaten', amount: '500 g', checked: false, household_id: HID, created_at: now },
    ],
    pending_inventory: [],
    recipes: [
      { id: 'rc1', title: 'Gefüllte Zucchini', source_url: '', source_type: 'web', video_id: null, thumbnail_url: null,
        author: '', tags: ['vegetarisch'], favorite: true,
        ingredients: [{ name: 'Zucchini', amount: '2' }, { name: 'Paprika edelsüß', amount: '1 TL' }, { name: 'Feta', amount: '200 g' }],
        steps: ['Zucchini aushöhlen.', 'Füllen und backen.'], notes: '', household_id: HID, created_at: now },
    ],
    activity_log: [],
    api_usage: [],
    user_integrations: [],
    freezer_storages: [{ id: 'fs1', label: 'Gefrierschrank Keller', emoji: '🧊', sort_order: 0, household_id: HID,
      compartments: [{ id: 'fc1', label: 'Schublade 1' }, { id: 'fc2', label: 'Schublade 2' }] }],
    freezer_items: [
      { id: 'fi1', name: 'Hähnchenbrust', category: 'geflügel', storage_id: 'fs1', compartment_id: 'fc1', portions: 2, portion_size: '300 g', frozen_at: day(-60), expiry_date: day(25), note: '', photo_data: null, needs_restock: false, household_id: HID, created_at: now },
      { id: 'fi2', name: 'Lasagne', category: 'fertiggericht', storage_id: 'fs1', compartment_id: 'fc2', portions: 3, portion_size: 'Portion', frozen_at: day(-20), expiry_date: day(70), note: '', photo_data: null, needs_restock: false, household_id: HID, created_at: now },
    ],
    cellar_racks: [{ id: 'cr1', label: 'Weinregal Keller', emoji: '🍷', slots: [], rows: 4, cols: 6, sort_order: 0, household_id: HID,
      conditions: { temperature: 'cool', light: 'dark', humidity: 'normal', vibration: 'still' } }],
    cellar_bottles: [
      { id: 'cb1', name: 'Riesling Kabinett', winery: 'Weingut Beispiel', vintage: 2019, region: 'Rheingau', country: 'Deutschland', grape: 'Riesling', color: 'weiß', wine_type: 'wein', sweetness: 'feinherb', classification: '', alcohol: '', alcohol_free: false, drink_from: 2021, drink_until: new Date().getFullYear(), rack_id: 'cr1', slot: '', grid_row: 0, grid_col: 1, count: 2, price_eur: 14, retailer: '', household_id: HID, created_at: now },
      { id: 'cb2', name: 'Spätburgunder', winery: 'Weingut Muster', vintage: 2021, region: 'Ahr', country: 'Deutschland', grape: 'Spätburgunder', color: 'rot', wine_type: 'wein', sweetness: 'trocken', classification: '', alcohol: '', alcohol_free: false, drink_from: 2023, drink_until: 2030, rack_id: 'cr1', slot: '', grid_row: 1, grid_col: 3, count: 1, price_eur: 19, retailer: '', household_id: HID, created_at: now },
    ],
    pantry_locations: [{ id: 'pl1', label: 'Vorratsschrank', emoji: '📦', shelves: [{ id: 'ps1', label: 'Fach 1' }, { id: 'ps2', label: 'Fach 2' }], sort_order: 0, household_id: HID, created_at: now }],
    pantry_items: [
      { id: 'pi1', name: 'Haferflocken zart', category: 'müsli', location_id: 'pl1', shelf_id: 'ps2', quantity: 2, unit: 'Packung', best_before: day(12), opened_at: null, photo_data: null, barcode: '', note: '', needs_restock: false, disposed_at: null, disposal_reason: '', household_id: HID, created_at: now },
      { id: 'pi2', name: 'Weizenmehl 405', category: 'mehl', location_id: 'pl1', shelf_id: 'ps1', quantity: 1, unit: 'kg', best_before: day(180), opened_at: null, photo_data: null, barcode: '', note: '', needs_restock: false, disposed_at: null, disposal_reason: '', household_id: HID, created_at: now },
    ],
  }
}

const db = seed()

function likeToRegex(pattern) {
  const esc = String(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')
  return new RegExp(`^${esc}$`, 'i')
}

class Query {
  constructor(table) {
    this.table = table
    this.op = 'select'
    this.filters = []
    this.orders = []
    this.limitN = null
    this.mode = 'many'
    this.selectStr = '*'
  }
  select(s = '*') { if (this.op === 'select') this.selectStr = s; return this }
  insert(rows) { this.op = 'insert'; this.payload = [].concat(rows); return this }
  upsert(rows) { this.op = 'upsert'; this.payload = [].concat(rows); return this }
  update(patch) { this.op = 'update'; this.payload = patch; return this }
  delete() { this.op = 'delete'; return this }
  eq(c, v) { this.filters.push(r => r[c] === v); return this }
  neq(c, v) { this.filters.push(r => r[c] !== v); return this }
  is(c, v) { this.filters.push(r => (v === null ? r[c] == null : r[c] === v)); return this }
  in(c, arr) { this.filters.push(r => arr.includes(r[c])); return this }
  ilike(c, p) { const re = likeToRegex(p); this.filters.push(r => re.test(r[c] ?? '')); return this }
  gte(c, v) { this.filters.push(r => r[c] >= v); return this }
  lte(c, v) { this.filters.push(r => r[c] <= v); return this }
  match(obj) { Object.entries(obj).forEach(([c, v]) => this.eq(c, v)); return this }
  order(spec, { ascending = true } = {}) {
    spec.split(',').map(s => s.trim()).filter(Boolean).forEach(c => this.orders.push([c, ascending]))
    return this
  }
  limit(n) { this.limitN = n; return this }
  maybeSingle() { this.mode = 'maybe'; return this }
  single() { this.mode = 'single'; return this }
  then(resolve, reject) { return Promise.resolve().then(() => this.exec()).then(resolve, reject) }

  exec() {
    const rows = (db[this.table] ||= [])
    const match = r => this.filters.every(f => f(r))
    if (this.op === 'insert' || this.op === 'upsert') {
      for (const row of this.payload) {
        const full = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }
        const i = this.op === 'upsert' ? rows.findIndex(r => r.id === full.id) : -1
        if (i >= 0) rows[i] = { ...rows[i], ...full }
        else rows.push(full)
      }
      return { data: this.payload, error: null }
    }
    if (this.op === 'update') {
      rows.filter(match).forEach(r => Object.assign(r, this.payload))
      return { data: null, error: null }
    }
    if (this.op === 'delete') {
      db[this.table] = rows.filter(r => !match(r))
      return { data: null, error: null }
    }
    let out = rows.filter(match).map(r => ({ ...r }))
    if (this.selectStr.includes('households(')) out.forEach(r => { r.households = db.households.find(h => h.id === r.household_id) ?? null })
    for (const [c, asc] of [...this.orders].reverse()) {
      out.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1))
    }
    if (this.limitN != null) out = out.slice(0, this.limitN)
    if (this.mode !== 'many') return { data: out[0] ?? null, error: null }
    return { data: out, error: null }
  }
}

const listeners = new Set()
const session = { user, access_token: 'demo' }

export const demoSupabase = {
  from: table => new Query(table),
  async rpc(name, args) {
    if (name === 'create_household') return { data: { ...db.households[0], role: 'owner' }, error: null }
    if (name === 'join_household') return { data: null, error: { message: 'invalid_code' } }
    if (name === 'regenerate_invite_code') return { data: 'DEMO6789', error: null }
    return { data: null, error: { message: `RPC ${name} gibt es im Demo-Modus nicht` } }
  },
  auth: {
    async getSession() { return { data: { session } } },
    async getUser() { return { data: { user } } },
    onAuthStateChange(cb) {
      listeners.add(cb)
      setTimeout(() => cb('INITIAL_SESSION', session), 0)
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } }
    },
    async updateUser({ data }) {
      Object.assign(user.user_metadata, data)
      listeners.forEach(cb => cb('USER_UPDATED', session))
      return { data: { user }, error: null }
    },
    async signOut() { return { error: null } },
    async signInWithPassword() { return { error: null } },
    async signUp() { return { data: { user, session }, error: null } },
    async resend() { return { error: null } },
    async resetPasswordForEmail() { return { error: null } },
  },
}
