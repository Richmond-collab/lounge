ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

UPDATE public.groups
SET is_published = false
WHERE slug = 'building-committee';
