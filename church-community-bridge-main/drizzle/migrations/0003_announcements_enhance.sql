-- Enhance announcements for CAC community app

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

INSERT INTO storage.buckets (id, name, public)
VALUES ('group-attachments', 'group-attachments', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
END $$;

-- Replace read policy: authenticated users read published announcements
DROP POLICY IF EXISTS "members read announcements" ON public.announcements;
CREATE POLICY "members read published announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    is_published = true
    AND (published_at IS NULL OR published_at <= now())
    AND (scheduled_for IS NULL OR scheduled_for <= now())
  );

-- Admins manage all
-- (existing policy "admins manage announcements" already covers ALL)

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
