-- =============================================================================
-- Backfill: add the Switzerland demo trip to every existing user that
-- doesn't already have one. Safe to re-run — the WHERE NOT EXISTS filter
-- makes it a no-op for users who already have the demo trip.
-- Run this in the Supabase SQL editor.
-- =============================================================================

do $$
declare
  u record;
  new_trip_id uuid;
  new_country_id uuid;
begin
  for u in
    select id
    from auth.users
    where not exists (
      select 1
      from public.trips t
      where t.user1_id = auth.users.id
        and t.name = '🇨🇭 Switzerland — A Dream Trip'
    )
  loop
    insert into public.trips (name, user1_id)
    values ('🇨🇭 Switzerland — A Dream Trip', u.id)
    returning id into new_trip_id;

    insert into public.countries (trip_id, country_code, country_name, status, added_by)
    values (new_trip_id, 'CH', 'Switzerland', 'planned', u.id)
    returning id into new_country_id;

    insert into public.trip_budget
      (trip_id, total_budget, flights, accommodation, food, activities, transport)
    values
      (new_trip_id, 1200, 280, 420, 180, 220, 100);

    insert into public.activities (country_id, name, category, date_start, budget, priority) values
      (new_country_id, 'Jungfraujoch — Top of Europe',            'adventure', '2025-07-14',  95, 'must'),
      (new_country_id, 'Paragliding boven Interlaken',            'adventure', '2025-07-15', 120, 'must'),
      (new_country_id, 'Chocolade atelier Maison Cailler Broc',   'culture',   '2025-07-13',  18, 'nice'),
      (new_country_id, 'Fondue diner Restaurant Chesery',         'food',      '2025-07-13',  45, 'must'),
      (new_country_id, 'Lac de Gruyères boottochtje',             'relax',     '2025-07-16',  12, 'nice');
  end loop;
end $$;
