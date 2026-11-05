-- CAC Gospel Hymn Book

create table public.hymns (
  id uuid primary key default gen_random_uuid(),
  hymn_number integer not null,
  title text not null,
  lyrics text not null,
  language text not null default 'English',
  category text,
  audio_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hymn_number, language)
);

create index hymns_number_idx on public.hymns (hymn_number);
create index hymns_language_idx on public.hymns (language);
create index hymns_title_idx on public.hymns (title);

alter table public.hymns enable row level security;

create policy "public read published hymns" on public.hymns
  for select to anon, authenticated using (is_published = true);

create policy "admins manage hymns" on public.hymns
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table public.hymn_favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hymn_id uuid not null references public.hymns(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, hymn_id)
);

create index hymn_favourites_user_idx on public.hymn_favourites (user_id);

alter table public.hymn_favourites enable row level security;

create policy "users read own favourites" on public.hymn_favourites
  for select to authenticated using (auth.uid() = user_id);

create policy "users manage own favourites" on public.hymn_favourites
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select on public.hymns to anon, authenticated;
grant all on public.hymns to service_role;
grant select, insert, delete on public.hymn_favourites to authenticated;
grant all on public.hymn_favourites to service_role;
