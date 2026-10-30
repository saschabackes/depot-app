-- Entsorgungs-Tracking für Gewürze
ALTER TABLE spices ADD COLUMN IF NOT EXISTS disposed_at DATE;
ALTER TABLE spices ADD COLUMN IF NOT EXISTS disposal_reason TEXT NOT NULL DEFAULT '';
