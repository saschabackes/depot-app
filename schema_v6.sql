-- v6: Gitteransicht für Weinregale (Reihe × Spalte)
ALTER TABLE cellar_racks ADD COLUMN IF NOT EXISTS rows int DEFAULT 0;
ALTER TABLE cellar_racks ADD COLUMN IF NOT EXISTS cols int DEFAULT 0;

ALTER TABLE cellar_bottles ADD COLUMN IF NOT EXISTS row int;
ALTER TABLE cellar_bottles ADD COLUMN IF NOT EXISTS col int;
