-- Basis-Portionen eines Rezepts (für den Personen-Umrechner)
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS servings integer CHECK (servings IS NULL OR servings BETWEEN 1 AND 100);
