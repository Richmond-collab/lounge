ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

CREATE TABLE public.hymns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hymn_number integer NOT NULL,
  title text NOT NULL,
  lyrics text NOT NULL,
  language text NOT NULL DEFAULT 'English',
  category text,
  audio_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hymn_number, language)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hymns TO authenticated;
GRANT ALL ON public.hymns TO service_role;
ALTER TABLE public.hymns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read published hymns" ON public.hymns FOR SELECT TO authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins manage hymns" ON public.hymns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.hymn_favourites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hymn_id uuid NOT NULL REFERENCES public.hymns(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, hymn_id)
);
GRANT SELECT, INSERT, DELETE ON public.hymn_favourites TO authenticated;
GRANT ALL ON public.hymn_favourites TO service_role;
ALTER TABLE public.hymn_favourites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own hymn favourites" ON public.hymn_favourites FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles readable by members" ON public.profiles;
CREATE POLICY "members read related profiles" ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.group_members mine
      JOIN public.group_members theirs ON theirs.group_id = mine.group_id
      WHERE mine.user_id = auth.uid() AND theirs.user_id = profiles.id
    )
    OR EXISTS (
      SELECT 1 FROM public.prayer_requests pr
      WHERE pr.user_id = profiles.id AND pr.is_private = false
    )
  );

DROP POLICY IF EXISTS "members read sermons" ON public.sermons;
CREATE POLICY "members read published sermons" ON public.sermons FOR SELECT TO authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "members read events" ON public.events;
CREATE POLICY "members read published events" ON public.events FOR SELECT TO authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "members read groups" ON public.groups;
CREATE POLICY "members read published groups" ON public.groups FOR SELECT TO authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "members read rsvps" ON public.event_rsvps;
CREATE POLICY "members read own or admin rsvps" ON public.event_rsvps FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "read supports" ON public.prayer_supports;
CREATE POLICY "members read own or admin supports" ON public.prayer_supports FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "read memberships" ON public.group_members;
CREATE POLICY "members read group memberships" ON public.group_members FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.is_group_member(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "members read posts" ON public.posts;
CREATE POLICY "group members read posts" ON public.posts FOR SELECT TO authenticated
  USING (
    public.is_group_member(group_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "members read comments" ON public.comments;
CREATE POLICY "group members read comments" ON public.comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = comments.post_id
        AND (
          public.is_group_member(p.group_id, auth.uid())
          OR public.has_role(auth.uid(), 'admin'::public.app_role)
        )
    )
  );

DROP POLICY IF EXISTS "members read announcements" ON public.announcements;
DROP POLICY IF EXISTS "members read published announcements" ON public.announcements;
CREATE POLICY "members read published announcements" ON public.announcements FOR SELECT TO authenticated
  USING (is_published = true AND (published_at IS NULL OR published_at <= now()) AND (scheduled_for IS NULL OR scheduled_for <= now()));