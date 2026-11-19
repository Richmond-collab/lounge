INSERT INTO public.groups (slug, name, description)
VALUES (
  'building-committee',
  'Building Committee Group',
  'Coordinate building projects, maintenance, and facilities planning.'
)
ON CONFLICT (slug) DO NOTHING;
