-- Admin role assignment (38278582-885a-493b-a511-18d8805ff767)
-- insert into public.user_roles (user_id, role) values ('38278582-885a-493b-a511-18d8805ff767'::uuid, 'admin') on conflict do nothing;

-- Storage bucket (create via Supabase dashboard Storage UI or SQL):
-- insert into storage.buckets (id, name, public) values ('group-attachments', 'group-attachments', false) on conflict do nothing;

-- Verification queries
-- select table_name from information_schema.tables where table_schema='public' order by 1;
-- select proname from pg_proc where proname in ('has_role','is_group_member');
-- select * from pg_policies where schemaname='public';
-- select * from public.user_roles;
