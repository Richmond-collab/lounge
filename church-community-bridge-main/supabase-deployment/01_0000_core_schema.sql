
create type public.app_role as enum ('admin','member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Member',
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by members" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url');
  insert into public.user_roles (user_id, role) values (new.id, 'member');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  speaker text not null,
  series text,
  description text,
  youtube_id text not null,
  preached_on date not null,
  created_at timestamptz not null default now()
);
grant select on public.sermons to authenticated;
grant insert, update, delete on public.sermons to authenticated;
grant all on public.sermons to service_role;
alter table public.sermons enable row level security;
create policy "members read sermons" on public.sermons for select to authenticated using (true);
create policy "admins manage sermons" on public.sermons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "members read events" on public.events for select to authenticated using (true);
create policy "admins manage events" on public.events for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  guests int not null default 0,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
grant select, insert, update, delete on public.event_rsvps to authenticated;
grant all on public.event_rsvps to service_role;
alter table public.event_rsvps enable row level security;
create policy "members read rsvps" on public.event_rsvps for select to authenticated using (true);
create policy "own rsvp insert" on public.event_rsvps for insert to authenticated with check (auth.uid() = user_id);
create policy "own rsvp update" on public.event_rsvps for update to authenticated using (auth.uid() = user_id);
create policy "own rsvp delete" on public.event_rsvps for delete to authenticated using (auth.uid() = user_id);

create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  is_anonymous boolean not null default false,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.prayer_requests to authenticated;
grant all on public.prayer_requests to service_role;
alter table public.prayer_requests enable row level security;
create policy "read public or own or admin prayers" on public.prayer_requests for select to authenticated
  using (not is_private or auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "own prayer insert" on public.prayer_requests for insert to authenticated with check (auth.uid() = user_id);
create policy "own prayer delete" on public.prayer_requests for delete to authenticated using (auth.uid() = user_id);

create table public.prayer_supports (
  prayer_id uuid not null references public.prayer_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (prayer_id, user_id)
);
grant select, insert, delete on public.prayer_supports to authenticated;
grant all on public.prayer_supports to service_role;
alter table public.prayer_supports enable row level security;
create policy "read supports" on public.prayer_supports for select to authenticated using (true);
create policy "own support insert" on public.prayer_supports for insert to authenticated with check (auth.uid() = user_id);
create policy "own support delete" on public.prayer_supports for delete to authenticated using (auth.uid() = user_id);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.groups to authenticated;
grant all on public.groups to service_role;
alter table public.groups enable row level security;
create policy "members read groups" on public.groups for select to authenticated using (true);
create policy "admins manage groups" on public.groups for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
grant select, insert, delete on public.group_members to authenticated;
grant all on public.group_members to service_role;
alter table public.group_members enable row level security;
create policy "read memberships" on public.group_members for select to authenticated using (true);
create policy "join self" on public.group_members for insert to authenticated with check (auth.uid() = user_id);
create policy "leave self" on public.group_members for delete to authenticated using (auth.uid() = user_id);

create or replace function public.is_group_member(_group uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = _group and user_id = _user)
$$;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "members read posts" on public.posts for select to authenticated using (true);
create policy "group members post" on public.posts for insert to authenticated with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));
create policy "own post delete" on public.posts for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "members read comments" on public.comments for select to authenticated using (true);
create policy "own comment insert" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "own comment delete" on public.comments for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

insert into public.groups (slug, name, description) values
('youth','Youth Fellowship','Young people growing in faith together — Bible study, music, and fun.'),
('women','Good Women Association','Sisters supporting one another in prayer, service, and fellowship.'),
('men','Men''s Fellowship','Brothers building strong faith, families, and community.'),
('choir','Choir & Music Ministry','Singers and musicians leading worship.');

insert into public.sermons (title, speaker, series, description, youtube_id, preached_on) values
('The Power of Prayer','Pastor (sample)','Walking in the Spirit','How persistent prayer transforms our lives and our community.','dQw4w9WgXcQ', current_date - 3),
('Faith That Moves Mountains','Pastor (sample)','Walking in the Spirit','Lessons on faith from Mark 11.','dQw4w9WgXcQ', current_date - 10),
('Grace for Every Season','Evangelist (sample)','Sunday Service','God''s grace in times of joy and trial.','dQw4w9WgXcQ', current_date - 17);

insert into public.events (title, description, location, starts_at, ends_at) values
('Sunday Worship Service','Join us for praise, worship and the Word.','Main Sanctuary', date_trunc('week', now()) + interval '6 days 9 hours', date_trunc('week', now()) + interval '6 days 12 hours'),
('Midweek Bible Study','Deep dive into the book of Acts.','Fellowship Hall', date_trunc('week', now()) + interval '9 days 18 hours', date_trunc('week', now()) + interval '9 days 20 hours'),
('Youth Night','Games, worship and fellowship for ages 13–25.','Youth Center', date_trunc('week', now()) + interval '11 days 17 hours', null),
('Night Vigil','All-night prayer and worship.','Main Sanctuary', date_trunc('week', now()) + interval '18 days 22 hours', null);
