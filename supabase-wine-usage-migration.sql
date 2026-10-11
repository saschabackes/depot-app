-- Verwendungszweck für Weine (Mehrfachauswahl): trinken, kochen, anlass, geschenk, aufheben
ALTER TABLE public.cellar_bottles ADD COLUMN IF NOT EXISTS usage text[] NOT NULL DEFAULT '{}';
