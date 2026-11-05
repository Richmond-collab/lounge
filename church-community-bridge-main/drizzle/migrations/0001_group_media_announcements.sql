ALTER TABLE public.posts ADD COLUMN image_path text;
ALTER TABLE public.posts ADD COLUMN audio_path text;

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "group members upload group attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'group-attachments'
  AND split_part(name, '/', 2) = auth.uid()::text
  AND public.is_group_member(split_part(name, '/', 1)::uuid, auth.uid())
);
CREATE POLICY "group members read group attachments" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'group-attachments'
  AND (
    public.is_group_member(split_part(name, '/', 1)::uuid, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY "owners and admins delete group attachments" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'group-attachments'
  AND (
    split_part(name, '/', 2) = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);