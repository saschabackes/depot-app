-- Vorratskammer-Modul: Lagerorte + Vorräte
-- Ausführen im Supabase SQL-Editor

-- ── Lagerorte (Schränke / Regale) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pantry_locations (
  id            TEXT PRIMARY KEY,
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  label         TEXT NOT NULL DEFAULT 'Vorratsschrank',
  emoji         TEXT NOT NULL DEFAULT '📦',
  shelves       JSONB NOT NULL DEFAULT '[]',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pantry_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pantry_locations_household" ON pantry_locations
  FOR ALL USING (household_id IN (
    SELECT id FROM households WHERE owner_id = auth.uid()
    UNION
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

-- ── Vorrats-Einträge ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pantry_items (
  id            TEXT PRIMARY KEY,
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'sonstiges',
  location_id   TEXT,
  shelf_id      TEXT,
  quantity       INTEGER NOT NULL DEFAULT 1,
  unit          TEXT NOT NULL DEFAULT 'Stück',
  best_before   DATE,
  opened_at     DATE,
  photo_data    TEXT,
  barcode       TEXT,
  note            TEXT NOT NULL DEFAULT '',
  needs_restock   BOOLEAN NOT NULL DEFAULT false,
  disposed_at     DATE,
  disposal_reason TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pantry_items_household" ON pantry_items
  FOR ALL USING (household_id IN (
    SELECT id FROM households WHERE owner_id = auth.uid()
    UNION
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_pantry_items_household ON pantry_items(household_id);
CREATE INDEX IF NOT EXISTS idx_pantry_locations_household ON pantry_locations(household_id);
