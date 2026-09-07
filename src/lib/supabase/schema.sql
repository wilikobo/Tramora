-- =============================================================================
-- Wayra — Supabase schema
-- Travel planner for two. All tables live under RLS; access is scoped to trip
-- members (user1_id / user2_id) or, for profiles, to the row owner.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  username    text unique,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- trips (exactly two travellers per trip)
-- -----------------------------------------------------------------------------
create table if not exists public.trips (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  user1_id       uuid not null references auth.users(id) on delete cascade,
  user2_id       uuid          references auth.users(id) on delete set null,
  invited_email  text,
  created_at     timestamptz not null default now(),
  constraint trips_distinct_members check (user1_id <> user2_id)
);

alter table public.trips add column if not exists invited_email text;

create index if not exists trips_user1_idx on public.trips(user1_id);
create index if not exists trips_user2_idx on public.trips(user2_id);

-- -----------------------------------------------------------------------------
-- countries (per trip)
-- -----------------------------------------------------------------------------
create table if not exists public.countries (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  country_code  text not null,
  country_name  text not null,
  status        text not null check (status in ('done', 'planned', 'wishlist')),
  added_by      uuid not null references auth.users(id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now(),
  unique (trip_id, country_code)
);

create index if not exists countries_trip_idx on public.countries(trip_id);

-- -----------------------------------------------------------------------------
-- activities (per country)
-- -----------------------------------------------------------------------------
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  country_id  uuid not null references public.countries(id) on delete cascade,
  name        text not null,
  category    text,
  date_start  date,
  date_end    date,
  budget      numeric(12, 2),
  priority    text not null default 'nice' check (priority in ('must', 'nice')),
  created_at  timestamptz not null default now()
);

create index if not exists activities_country_idx on public.activities(country_id);

-- -----------------------------------------------------------------------------
-- votes (yes/no per activity per user; one vote per user per activity)
-- -----------------------------------------------------------------------------
create table if not exists public.votes (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references public.activities(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  vote         text not null check (vote in ('yes', 'no')),
  created_at   timestamptz not null default now(),
  unique (activity_id, user_id)
);

create index if not exists votes_activity_idx on public.votes(activity_id);
create index if not exists votes_user_idx     on public.votes(user_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles   enable row level security;
alter table public.trips      enable row level security;
alter table public.countries  enable row level security;
alter table public.activities enable row level security;
alter table public.votes      enable row level security;

-- Helper: is the current user a member of the given trip?
create or replace function public.is_trip_member(trip uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trips t
    where t.id = trip
      and (t.user1_id = auth.uid() or t.user2_id = auth.uid())
  );
$$;

-- -----------------------------------------------------------------------------
-- profiles policies
-- -----------------------------------------------------------------------------
drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users insert their own profile" on public.profiles;
create policy "users insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete their own profile" on public.profiles;
create policy "users delete their own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- trips policies
-- -----------------------------------------------------------------------------
drop policy if exists "members read trip" on public.trips;
create policy "members read trip"
  on public.trips for select
  to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "users create trip they belong to" on public.trips;
create policy "users create trip they belong to"
  on public.trips for insert
  to authenticated
  with check (auth.uid() = user1_id);

drop policy if exists "members update trip" on public.trips;
create policy "members update trip"
  on public.trips for update
  to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id)
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "members delete trip" on public.trips;
create policy "members delete trip"
  on public.trips for delete
  to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- -----------------------------------------------------------------------------
-- countries policies (trip members)
-- -----------------------------------------------------------------------------
drop policy if exists "members read countries" on public.countries;
create policy "members read countries"
  on public.countries for select
  to authenticated
  using (public.is_trip_member(trip_id));

drop policy if exists "members insert countries" on public.countries;
create policy "members insert countries"
  on public.countries for insert
  to authenticated
  with check (public.is_trip_member(trip_id) and added_by = auth.uid());

drop policy if exists "members update countries" on public.countries;
create policy "members update countries"
  on public.countries for update
  to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

drop policy if exists "members delete countries" on public.countries;
create policy "members delete countries"
  on public.countries for delete
  to authenticated
  using (public.is_trip_member(trip_id));

-- -----------------------------------------------------------------------------
-- activities policies (via parent country → trip)
-- -----------------------------------------------------------------------------
drop policy if exists "members read activities" on public.activities;
create policy "members read activities"
  on public.activities for select
  to authenticated
  using (
    exists (
      select 1 from public.countries c
      where c.id = activities.country_id
        and public.is_trip_member(c.trip_id)
    )
  );

drop policy if exists "members insert activities" on public.activities;
create policy "members insert activities"
  on public.activities for insert
  to authenticated
  with check (
    exists (
      select 1 from public.countries c
      where c.id = activities.country_id
        and public.is_trip_member(c.trip_id)
    )
  );

drop policy if exists "members update activities" on public.activities;
create policy "members update activities"
  on public.activities for update
  to authenticated
  using (
    exists (
      select 1 from public.countries c
      where c.id = activities.country_id
        and public.is_trip_member(c.trip_id)
    )
  )
  with check (
    exists (
      select 1 from public.countries c
      where c.id = activities.country_id
        and public.is_trip_member(c.trip_id)
    )
  );

drop policy if exists "members delete activities" on public.activities;
create policy "members delete activities"
  on public.activities for delete
  to authenticated
  using (
    exists (
      select 1 from public.countries c
      where c.id = activities.country_id
        and public.is_trip_member(c.trip_id)
    )
  );

-- -----------------------------------------------------------------------------
-- votes policies (own vote; members can read all votes on their trips)
-- -----------------------------------------------------------------------------
drop policy if exists "members read votes" on public.votes;
create policy "members read votes"
  on public.votes for select
  to authenticated
  using (
    exists (
      select 1
      from public.activities a
      join public.countries  c on c.id = a.country_id
      where a.id = votes.activity_id
        and public.is_trip_member(c.trip_id)
    )
  );

drop policy if exists "users insert own vote" on public.votes;
create policy "users insert own vote"
  on public.votes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.activities a
      join public.countries  c on c.id = a.country_id
      where a.id = votes.activity_id
        and public.is_trip_member(c.trip_id)
    )
  );

drop policy if exists "users update own vote" on public.votes;
create policy "users update own vote"
  on public.votes for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users delete own vote" on public.votes;
create policy "users delete own vote"
  on public.votes for delete
  to authenticated
  using (user_id = auth.uid());
