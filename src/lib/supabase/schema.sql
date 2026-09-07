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
-- countries (personal when trip_id is null, otherwise scoped to a trip)
-- -----------------------------------------------------------------------------
create table if not exists public.countries (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid references public.trips(id) on delete cascade,
  country_code  text not null,
  country_name  text not null,
  status        text not null check (status in ('done', 'planned', 'wishlist')),
  added_by      uuid not null references auth.users(id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now(),
  unique (trip_id, country_code)
);

-- Personal countries: trip_id IS NULL, owned by added_by.
alter table public.countries alter column trip_id drop not null;

create index if not exists countries_trip_idx     on public.countries(trip_id);
create index if not exists countries_personal_idx on public.countries(added_by) where trip_id is null;

-- One row per personal country per user (unique across null trip_ids, which
-- Postgres would otherwise treat as always distinct).
create unique index if not exists countries_personal_code_unique
  on public.countries (added_by, country_code)
  where trip_id is null;

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
  status      text not null default 'planned' check (status in ('planned', 'done')),
  created_at  timestamptz not null default now()
);

alter table public.activities
  add column if not exists status text not null default 'planned'
  check (status in ('planned', 'done'));

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
-- countries policies
-- Personal rows (trip_id IS NULL) belong to added_by; trip rows are visible
-- to trip members.
-- -----------------------------------------------------------------------------
drop policy if exists "members read countries" on public.countries;
create policy "members read countries"
  on public.countries for select
  to authenticated
  using (
    (trip_id is null and added_by = auth.uid())
    or (trip_id is not null and public.is_trip_member(trip_id))
  );

drop policy if exists "members insert countries" on public.countries;
create policy "members insert countries"
  on public.countries for insert
  to authenticated
  with check (
    added_by = auth.uid()
    and (
      trip_id is null
      or public.is_trip_member(trip_id)
    )
  );

drop policy if exists "members update countries" on public.countries;
create policy "members update countries"
  on public.countries for update
  to authenticated
  using (
    (trip_id is null and added_by = auth.uid())
    or (trip_id is not null and public.is_trip_member(trip_id))
  )
  with check (
    (trip_id is null and added_by = auth.uid())
    or (trip_id is not null and public.is_trip_member(trip_id))
  );

drop policy if exists "members delete countries" on public.countries;
create policy "members delete countries"
  on public.countries for delete
  to authenticated
  using (
    (trip_id is null and added_by = auth.uid())
    or (trip_id is not null and public.is_trip_member(trip_id))
  );

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
        and (
          (c.trip_id is null and c.added_by = auth.uid())
          or (c.trip_id is not null and public.is_trip_member(c.trip_id))
        )
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
        and (
          (c.trip_id is null and c.added_by = auth.uid())
          or (c.trip_id is not null and public.is_trip_member(c.trip_id))
        )
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
        and (
          (c.trip_id is null and c.added_by = auth.uid())
          or (c.trip_id is not null and public.is_trip_member(c.trip_id))
        )
    )
  )
  with check (
    exists (
      select 1 from public.countries c
      where c.id = activities.country_id
        and (
          (c.trip_id is null and c.added_by = auth.uid())
          or (c.trip_id is not null and public.is_trip_member(c.trip_id))
        )
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
        and (
          (c.trip_id is null and c.added_by = auth.uid())
          or (c.trip_id is not null and public.is_trip_member(c.trip_id))
        )
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
        and (
          (c.trip_id is null and c.added_by = auth.uid())
          or (c.trip_id is not null and public.is_trip_member(c.trip_id))
        )
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
        and (
          (c.trip_id is null and c.added_by = auth.uid())
          or (c.trip_id is not null and public.is_trip_member(c.trip_id))
        )
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

-- -----------------------------------------------------------------------------
-- memories (per country: photos + notes tied to a visited country)
-- -----------------------------------------------------------------------------
create table if not exists public.memories (
  id          uuid primary key default gen_random_uuid(),
  country_id  uuid not null references public.countries(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  photo_url   text,
  note        text,
  visit_date  date,
  created_at  timestamptz not null default now()
);

create index if not exists memories_country_idx on public.memories(country_id);
create index if not exists memories_user_idx    on public.memories(user_id);

alter table public.memories enable row level security;

drop policy if exists "members read memories" on public.memories;
create policy "members read memories"
  on public.memories for select
  to authenticated
  using (
    exists (
      select 1 from public.countries c
      where c.id = memories.country_id
        and (
          (c.trip_id is null and c.added_by = auth.uid())
          or (c.trip_id is not null and public.is_trip_member(c.trip_id))
        )
    )
  );

drop policy if exists "members insert memories" on public.memories;
create policy "members insert memories"
  on public.memories for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.countries c
      where c.id = memories.country_id
        and (
          (c.trip_id is null and c.added_by = auth.uid())
          or (c.trip_id is not null and public.is_trip_member(c.trip_id))
        )
    )
  );

drop policy if exists "members update own memory" on public.memories;
create policy "members update own memory"
  on public.memories for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "members delete own memory" on public.memories;
create policy "members delete own memory"
  on public.memories for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- trip_links (custom curated resources per trip)
-- -----------------------------------------------------------------------------
create table if not exists public.trip_links (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  title      text not null,
  url        text not null,
  category   text not null default 'other',
  added_by   uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists trip_links_trip_idx on public.trip_links(trip_id);

alter table public.trip_links enable row level security;

drop policy if exists "members read trip_links" on public.trip_links;
create policy "members read trip_links"
  on public.trip_links for select
  to authenticated
  using (public.is_trip_member(trip_id));

drop policy if exists "members insert trip_links" on public.trip_links;
create policy "members insert trip_links"
  on public.trip_links for insert
  to authenticated
  with check (public.is_trip_member(trip_id));

drop policy if exists "members update trip_links" on public.trip_links;
create policy "members update trip_links"
  on public.trip_links for update
  to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

drop policy if exists "members delete trip_links" on public.trip_links;
create policy "members delete trip_links"
  on public.trip_links for delete
  to authenticated
  using (public.is_trip_member(trip_id));

-- -----------------------------------------------------------------------------
-- trip_budget (one row per trip)
-- -----------------------------------------------------------------------------
create table if not exists public.trip_budget (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid not null unique references public.trips(id) on delete cascade,
  total_budget   numeric(12, 2) not null default 0,
  flights        numeric(12, 2) not null default 0,
  accommodation  numeric(12, 2) not null default 0,
  food           numeric(12, 2) not null default 0,
  activities     numeric(12, 2) not null default 0,
  transport      numeric(12, 2) not null default 0,
  other          numeric(12, 2) not null default 0,
  updated_at     timestamptz not null default now()
);

alter table public.trip_budget enable row level security;

-- Legacy per-command policies are replaced by a single FOR ALL policy below.
drop policy if exists "members read trip_budget"   on public.trip_budget;
drop policy if exists "members insert trip_budget" on public.trip_budget;
drop policy if exists "members update trip_budget" on public.trip_budget;
drop policy if exists "members delete trip_budget" on public.trip_budget;

-- Trip members can read, insert, update and delete their trip's budget.
-- Written as a self-contained subquery on public.trips so upserts succeed
-- even before the helper function's search_path has been re-evaluated.
drop policy if exists "Users can manage trip budget" on public.trip_budget;
create policy "Users can manage trip budget"
  on public.trip_budget
  for all
  to authenticated
  using (
    trip_id in (
      select id from public.trips
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  )
  with check (
    trip_id in (
      select id from public.trips
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

-- =============================================================================
-- Storage: wayra-memories bucket
-- Create the bucket in the Supabase dashboard (public read, authenticated write).
-- Object path convention: {country_id}/{user_id}/{filename}
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('wayra-memories', 'wayra-memories', true)
on conflict (id) do nothing;

drop policy if exists "public read wayra-memories" on storage.objects;
create policy "public read wayra-memories"
  on storage.objects for select
  to public
  using (bucket_id = 'wayra-memories');

drop policy if exists "auth upload wayra-memories" on storage.objects;
create policy "auth upload wayra-memories"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'wayra-memories' and owner = auth.uid());

drop policy if exists "auth update own wayra-memories" on storage.objects;
create policy "auth update own wayra-memories"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'wayra-memories' and owner = auth.uid())
  with check (bucket_id = 'wayra-memories' and owner = auth.uid());

drop policy if exists "auth delete own wayra-memories" on storage.objects;
create policy "auth delete own wayra-memories"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'wayra-memories' and owner = auth.uid());
