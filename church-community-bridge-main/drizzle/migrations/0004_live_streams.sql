-- Live streaming tables

create table public.live_streams (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Live Service',
  status text not null default 'idle' check (status in ('idle','live','ended')),
  stream_key text unique,
  playback_url text,
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.live_streams enable row level security;

create policy "members read live streams" on public.live_streams
  for select to authenticated using (true);

create policy "admins manage live streams" on public.live_streams
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

grant select on public.live_streams to anon, authenticated;
grant all on public.live_streams to service_role;
