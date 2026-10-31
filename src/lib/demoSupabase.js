// Nur Entwicklung: `?demo` ersetzt Supabase durch eine Datenbank im Arbeitsspeicher,
// damit sich die App ohne Login und ohne echte Daten bedienen lässt.

const HID = '00000000-0000-4000-8000-000000000001'
const UID = '00000000-0000-4000-8000-0000000000aa'
const now = new Date().toISOString()
const localDay = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
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

// Post: erfundene Beispieldaten (Personen, Vorgänge in allen Zuständen)
const postItem = (id, o) => ({
  id, household_id: HID, created_by: UID, kind: 'rechnung', reviewed: true, sender: '', title: '', note: '', person_id: null,
  received_on: localDay(-10), invoice_date: null, due_date: null, amount_cents: null, iban: '', reference: '', related_id: null,
  original_location: '', pay_status: 'offen', paid_on: null, reimb_status: null, submitted_on: null, reimbursed_on: null,
  reimbursed_cents: null, archived_at: null, created_at: now, ...o,
})
const postPage = (id, itemId, n = 0) => ({ id, household_id: HID, item_id: itemId, path: `${HID}/${itemId}/${n}.jpg`, sort_order: n, ocr_status: 'pending', ocr_text: null, suggested: null, created_at: now })

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
      // entsorgt: teils innerhalb, teils außerhalb von 3 Monaten
      { ...spice('sp20', 'Paprika edelsüß', 'Ostmann', 'loc1', day(-40), 0), disposed_at: localDay(-20), disposal_reason: 'abgelaufen' },
      { ...spice('sp21', 'Oregano', 'Fuchs', 'loc2', day(100), 0), disposed_at: localDay(-45), disposal_reason: 'schaedling' },
      { ...spice('sp22', 'Majoran', 'Edora', 'loc1', day(-200), 0), disposed_at: localDay(-200), disposal_reason: 'abgelaufen' },
      { ...spice('sp23', 'Paprika edelsüß', 'Fuchs', 'loc2', day(-420), 0), disposed_at: localDay(-400), disposal_reason: 'abgelaufen' },
      spice('sp8', 'Basilikum', 'Fuchs', 'loc2', day(300), 3, 'gerebelt'),
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
      { id: 'rc2', title: 'Klassisches Rindergulasch', source_url: '', source_type: 'web', video_id: null, thumbnail_url: null,
        author: 'Emmi', tags: ['Fleisch'], favorite: false, servings: 4,
        ingredients: ['600 g Rindergulasch', '400 ml Rinderfond', '300 g Schalotten', '200 ml trockener Rotwein', '40 g Tomatenmark',
          '2-3 EL Butterschmalz', '1 Knoblauchzehe', '2 TL Paprika edelsüß', '1/2 TL Majoran', '1 Prise Salz'].map(name => ({ name, amount: '' })),
        steps: ['Fleisch anbraten.', 'Schmoren lassen.'], notes: '', household_id: HID, created_at: now },
    ],
    meal_plan: [
      { id: 'mp1', household_id: HID, date: localDay(0), recipe_id: 'rc2', servings: null, position: 0, created_at: now },
      { id: 'mp2', household_id: HID, date: localDay(1), recipe_id: 'rc1', servings: null, position: 0, created_at: now },
      { id: 'mp3', household_id: HID, date: localDay(3), recipe_id: 'rc2', servings: 6, position: 0, created_at: now },
    ],
    activity_log: [],
    api_usage: [],
    user_integrations: [],
    post_persons: [
      { id: 'pp1', household_id: HID, name: 'Anna', insurance: 'pkv', sort_order: 0, created_at: now },
      { id: 'pp2', household_id: HID, name: 'Ben', insurance: 'gkv', sort_order: 1, created_at: now },
      { id: 'pp3', household_id: HID, name: 'Mia', insurance: 'pkv', sort_order: 2, created_at: now },
    ],
    post_items: [
      postItem('po1', { sender: 'Stadtwerke', due_date: localDay(-3), amount_cents: 8420, received_on: localDay(-14) }),
      postItem('po2', { kind: 'arztrechnung', sender: 'Dr. Meier Zahnarzt', person_id: 'pp1', amount_cents: 21250, due_date: localDay(-20), pay_status: 'bezahlt', paid_on: localDay(-18), reimb_status: 'einzureichen' }),
      postItem('po3', { kind: 'arztrechnung', sender: 'Praxis Dr. Lang', person_id: 'pp3', amount_cents: 6318, due_date: localDay(4), reimb_status: 'einzureichen' }),
      postItem('po4', { sender: 'Mobilfunk Nord', due_date: localDay(20), amount_cents: 2999 }),
      postItem('po5', { kind: null, reviewed: false, received_on: localDay(0) }),
      postItem('po6', { kind: 'arztrechnung', sender: 'Augenarzt Weber', person_id: 'pp1', amount_cents: 9800, due_date: localDay(-40), pay_status: 'bezahlt', paid_on: localDay(-38), reimb_status: 'eingereicht', submitted_on: localDay(-35) }),
      postItem('po7', { sender: 'Hausrat Versicherung', amount_cents: 12500, due_date: localDay(-60), pay_status: 'bezahlt', paid_on: localDay(-58), received_on: localDay(-70) }),
      postItem('po8', { kind: 'arztrechnung', sender: 'Zahnarzt Zuzahlung', person_id: 'pp2', amount_cents: 4500, due_date: localDay(10) }),
      postItem('po9', { kind: 'arztrechnung', sender: 'Kinderärztin Dr. Roth', person_id: 'pp3', amount_cents: 3120, due_date: localDay(-50), pay_status: 'bezahlt', paid_on: localDay(-49), reimb_status: 'erstattet', submitted_on: localDay(-45), reimbursed_on: localDay(-20), reimbursed_cents: 3120 }),
    ],
    post_pages: [postPage('pg1', 'po1'), postPage('pg2', 'po2'), postPage('pg3', 'po2', 1), postPage('pg4', 'po5')],
    freezer_storages: [{ id: 'fs1', label: 'Gefrierschrank Keller', emoji: '🧊', sort_order: 0, household_id: HID,
      compartments: [{ id: 'fc1', label: 'Schublade 1' }, { id: 'fc2', label: 'Schublade 2' }] }],
    freezer_items: [
      { id: 'fi1', name: 'Hähnchenbrust', category: 'geflügel', storage_id: 'fs1', compartment_id: 'fc1', portions: 2, portion_size: '300 g', frozen_at: day(-60), expiry_date: day(25), note: '', photo_data: null, needs_restock: false, household_id: HID, created_at: now },
      { id: 'fi2', name: 'Lasagne', category: 'fertiggericht', storage_id: 'fs1', compartment_id: 'fc2', portions: 3, portion_size: 'Portion', frozen_at: day(-20), expiry_date: day(70), note: '', photo_data: null, needs_restock: false, household_id: HID, created_at: now },
    ],
    cellar_racks: [{ id: 'cr1', label: 'Weinregal Keller', emoji: '🍷', slots: [], rows: 4, cols: 6, sort_order: 0, household_id: HID,
      conditions: { temperature: 'cool', light: 'dark', humidity: 'normal', vibration: 'still' } }],
    cellar_bottles: [
      { id: 'cb1', name: 'Riesling Kabinett', winery: 'Weingut Beispiel', vintage: 2019, region: 'Rheingau', country: 'Deutschland', grape: 'Riesling', color: 'weiß', wine_type: 'wein', sweetness: 'feinherb', classification: '', alcohol: '', alcohol_free: false, drink_from: 2021, drink_until: new Date().getFullYear(), rack_id: 'cr1', slot: '', grid_row: 1, grid_col: 2, count: 2, price_eur: 14, retailer: '', household_id: HID, created_at: now },
      { id: 'cb2', name: 'Spätburgunder', winery: 'Weingut Muster', vintage: 2021, region: 'Ahr', country: 'Deutschland', grape: 'Spätburgunder', color: 'rot', wine_type: 'wein', sweetness: 'trocken', classification: '', alcohol: '', alcohol_free: false, drink_from: 2023, drink_until: 2030, rack_id: 'cr1', slot: '', grid_row: 2, grid_col: 4, count: 1, price_eur: 19, usage: ['kochen'], retailer: '', household_id: HID, created_at: now },
    ],
    price_watch: [
      { id: 'pw1', name: 'Alpro No Milk', search_term: 'alpro', target_price: 1.99, offer_price: 1.99, offer_store: 'PENNY', offer_until: day(2), best_price: 1.79, best_store: 'Kaufland', checked_at: now, sort_order: 0, household_id: HID, created_at: now },
      { id: 'pw2', name: 'Lavazza Crema e Gusto', search_term: 'lavazza', target_price: 11.99, offer_price: null, offer_store: '', offer_until: null, best_price: null, best_store: '', checked_at: null, sort_order: 1, household_id: HID, created_at: now },
    ],
    pantry_locations: [{ id: 'pl1', label: 'Vorratsschrank', emoji: '📦', shelves: [{ id: 'ps1', label: 'Fach 1' }, { id: 'ps2', label: 'Fach 2' }], sort_order: 0, household_id: HID, created_at: now }],
    pantry_items: [
      { id: 'pi1', name: 'Haferflocken zart', category: 'müsli', location_id: 'pl1', shelf_id: 'ps2', quantity: 2, unit: 'Packung', best_before: day(12), opened_at: null, photo_data: null, barcode: '', note: '', needs_restock: false, disposed_at: null, disposal_reason: '', household_id: HID, created_at: now },
      { id: 'pi10', name: 'Haferflocken zart', category: 'müsli', location_id: 'pl1', shelf_id: 'ps2', quantity: 0, unit: 'Packung', best_before: day(-30), opened_at: null, photo_data: null, barcode: '', note: '', needs_restock: false, disposed_at: localDay(-15), disposal_reason: 'schimmel', household_id: HID, created_at: now },
      { id: 'pi11', name: 'Weizenmehl 405', category: 'mehl', location_id: 'pl1', shelf_id: 'ps1', quantity: 0, unit: 'kg', best_before: day(-90), opened_at: null, photo_data: null, barcode: '', note: '', needs_restock: false, disposed_at: localDay(-60), disposal_reason: 'schaedling', household_id: HID, created_at: now },
      { id: 'pi12', name: 'Basmatireis', category: 'reis', location_id: 'pl1', shelf_id: 'ps1', quantity: 0, unit: 'Packung', best_before: day(-150), opened_at: null, photo_data: null, barcode: '', note: '', needs_restock: false, disposed_at: localDay(-130), disposal_reason: 'abgelaufen', household_id: HID, created_at: now },
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

// Fotos der Post: Hochgeladenes bleibt im Arbeitsspeicher, sonst erscheint eine Platzhalter-Seite
const files = new Map()
const placeholderPage = path => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#faf8f2"/><rect x="40" y="40" width="200" height="24" fill="#c9c4b5"/>${Array.from({ length: 14 }, (_, i) => `<rect x="40" y="${120 + i * 36}" width="${i % 5 === 4 ? 320 : 520}" height="12" fill="#e2ded1"/>`).join('')}<text x="40" y="760" font-family="sans-serif" font-size="22" fill="#8a8575">Demo-Brief ${path.split('/').pop()}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
const demoStorage = {
  from: () => ({
    async upload(path, blob) { files.set(path, blob); return { data: { path }, error: null } },
    async createSignedUrl(path) { return { data: { signedUrl: files.has(path) ? URL.createObjectURL(files.get(path)) : placeholderPage(path) }, error: null } },
    async remove(paths) { paths.forEach(p => files.delete(p)); return { data: [], error: null } },
  }),
}

const listeners = new Set()
const session = { user, access_token: 'demo' }

export const demoSupabase = {
  from: table => new Query(table),
  storage: demoStorage,
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
