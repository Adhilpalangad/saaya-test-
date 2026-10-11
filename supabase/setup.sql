-- Run in the Supabase SQL Editor. Safe to rerun; existing results are preserved.
begin;
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
grant select on public.admins to authenticated;
revoke all on public.admins from anon;
drop policy if exists "Read own membership" on public.admins;
create policy "Read own membership" on public.admins for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.events (
  name text primary key,
  category text not null,
  sort_order integer not null,
  status text not null default 'upcoming' check (status in ('upcoming','live','done')),
  winners jsonb not null default '[]'::jsonb check (jsonb_typeof(winners) = 'array' and jsonb_array_length(winners) in (0,3))
);
create table if not exists public.leaderboard_settings (
  id integer primary key check (id = 1),
  is_manual boolean not null default false,
  manual_points jsonb not null default '{"Targaryen":0,"Stark":0,"Lannister":0}'::jsonb,
  check (jsonb_typeof(manual_points) = 'object')
);
insert into public.leaderboard_settings(id) values (1) on conflict do nothing;
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  src text not null check (src like 'https://res.cloudinary.com/%'),
  public_id text not null unique check (public_id like 'saaya/gallery/%'),
  cap text not null check (char_length(cap) between 1 and 300),
  y integer not null check (y between 2000 and 2100),
  created_at timestamptz not null default now()
);
create index if not exists gallery_created_at_idx on public.gallery(created_at desc);

alter table public.events enable row level security;
alter table public.leaderboard_settings enable row level security;
alter table public.gallery enable row level security;
grant select on public.events, public.leaderboard_settings, public.gallery to anon, authenticated;
grant update on public.events, public.leaderboard_settings to authenticated;
grant insert, delete on public.gallery to authenticated;
revoke insert, update, delete on public.events, public.leaderboard_settings, public.gallery from anon;

drop policy if exists "Public events" on public.events;
create policy "Public events" on public.events for select using (true);
drop policy if exists "Admin event edits" on public.events;
create policy "Admin event edits" on public.events for update to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins where user_id = (select auth.uid())));
drop policy if exists "Public leaderboard" on public.leaderboard_settings;
create policy "Public leaderboard" on public.leaderboard_settings for select using (true);
drop policy if exists "Admin leaderboard edits" on public.leaderboard_settings;
create policy "Admin leaderboard edits" on public.leaderboard_settings for update to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins where user_id = (select auth.uid())));
drop policy if exists "Public gallery" on public.gallery;
create policy "Public gallery" on public.gallery for select using (true);
drop policy if exists "Admin gallery inserts" on public.gallery;
create policy "Admin gallery inserts" on public.gallery for insert to authenticated
  with check (exists (select 1 from public.admins where user_id = (select auth.uid())));
drop policy if exists "Admin gallery deletes" on public.gallery;
create policy "Admin gallery deletes" on public.gallery for delete to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())));
commit;

-- Event seed follows. No dummy winners or fake gallery photos are imported.

insert into public.events(name,category,sort_order) values
('Thiruvathirakali','On Stage',0),
('Solo Dance Boys','On Stage',1),
('Spot Dance','On Stage',2),
('Mime','On Stage',3),
('Video Choreography Boys','On Stage',4),
('Solo Dance Girls','On Stage',5),
('Kolkali','On Stage',6),
('Synchronisation Dance Girls','On Stage',7),
('Synchronisation Dance Boys','On Stage',8),
('Vattapattu','On Stage',9),
('Oppana','On Stage',10),
('Video Choreography Girls','On Stage',11),
('Duffmuttu','On Stage',12),
('Karaoke','On Stage',13),
('Spot Photography','Off Stage',14),
('Poem Writing English','Off Stage',15),
('Poem Writing Malayalam','Off Stage',16),
('Poem Writing Hindi','Off Stage',17),
('Pencil Drawing','Off Stage',18),
('Story Writing English','Off Stage',19),
('Story Writing Malayalam','Off Stage',20),
('Story Writing Hindi','Off Stage',21),
('Cartoon Drawing','Off Stage',22),
('Mehandi','Off Stage',23),
('Nail Art','Off Stage',24),
('Instruments','Pre Stage',25),
('Mimicry','Pre Stage',26),
('Mono Act','Pre Stage',27),
('Light Music','Pre Stage',28),
('Rap (English, Malayalam)','Pre Stage',29),
('Mappila Paatu','Pre Stage',30),
('Patriotic Song','Pre Stage',31),
('Poem Recitation English','Pre Stage',32),
('Poem Recitation Malayalam','Pre Stage',33),
('Poem Recitation Hindi','Pre Stage',34),
('Classical Music','Pre Stage',35),
('Nadan Pattu','Pre Stage',36),
('Elocution English','Pre Stage',37),
('Elocution Malayalam','Pre Stage',38),
('Group Song Western','Pre Stage',39)
on conflict (name) do nothing;
