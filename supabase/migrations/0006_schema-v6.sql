-- v6: Gitteransicht für Weinregale (Reihe × Spalte)
ALTER TABLE cellar_racks ADD COLUMN IF NOT EXISTS rows int DEFAULT 0;
ALTER TABLE cellar_racks ADD COLUMN IF NOT EXISTS cols int DEFAULT 0;

-- "row" ist ein reserviertes Wort in PostgreSQL, daher grid_row/grid_col
ALTER TABLE cellar_bottles ADD COLUMN IF NOT EXISTS grid_row int;
ALTER TABLE cellar_bottles ADD COLUMN IF NOT EXISTS grid_col int;

-- Falls die alten Spalten existieren (aus fehlerhafter v6), migrieren und löschen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cellar_bottles' AND column_name = 'row') THEN
    UPDATE cellar_bottles SET grid_row = "row" WHERE "row" IS NOT NULL;
    ALTER TABLE cellar_bottles DROP COLUMN "row";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cellar_bottles' AND column_name = 'col') THEN
    UPDATE cellar_bottles SET grid_col = "col" WHERE "col" IS NOT NULL;
    ALTER TABLE cellar_bottles DROP COLUMN "col";
  END IF;
END $$;
