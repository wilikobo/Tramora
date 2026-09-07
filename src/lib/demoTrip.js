import { supabase } from './supabase.js'

export const DEMO_TRIP_NAME = '🇨🇭 Switzerland — A Dream Trip'

export const DEMO_BUDGET = {
  total_budget: 1200,
  flights: 280,
  accommodation: 420,
  food: 180,
  activities: 220,
  transport: 100,
  other: 0,
}

const DEMO_ACTIVITIES = [
  {
    name: 'Jungfraujoch — Top of Europe',
    category: 'adventure',
    date_start: '2025-07-14',
    budget: 95,
    priority: 'must',
  },
  {
    name: 'Paragliding boven Interlaken',
    category: 'adventure',
    date_start: '2025-07-15',
    budget: 120,
    priority: 'must',
  },
  {
    name: 'Chocolade atelier Maison Cailler Broc',
    category: 'culture',
    date_start: '2025-07-13',
    budget: 18,
    priority: 'nice',
  },
  {
    name: 'Fondue diner Restaurant Chesery',
    category: 'food',
    date_start: '2025-07-13',
    budget: 45,
    priority: 'must',
  },
  {
    name: 'Lac de Gruyères boottochtje',
    category: 'relax',
    date_start: '2025-07-16',
    budget: 12,
    priority: 'nice',
  },
]

export async function seedDemoTrip(userId) {
  if (!userId) return null

  const { data: existing } = await supabase
    .from('trips')
    .select('id')
    .eq('user1_id', userId)
    .eq('name', DEMO_TRIP_NAME)
    .maybeSingle()
  if (existing) {
    await supabase.from('trip_budget').upsert(
      {
        trip_id: existing.id,
        total_budget: 1200,
        flights: 280,
        accommodation: 420,
        food: 180,
        activities: 220,
        transport: 100,
      },
      { onConflict: 'trip_id', ignoreDuplicates: true },
    )
    return existing
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({ name: DEMO_TRIP_NAME, user1_id: userId })
    .select('id')
    .single()
  if (tripError) throw tripError

  const { data: country, error: countryError } = await supabase
    .from('countries')
    .insert({
      trip_id: trip.id,
      country_code: 'CH',
      country_name: 'Switzerland',
      status: 'planned',
      added_by: userId,
    })
    .select('id')
    .single()
  if (countryError) throw countryError

  await supabase.from('trip_budget').insert({
    trip_id: trip.id,
    total_budget: 1200,
    flights: 280,
    accommodation: 420,
    food: 180,
    activities: 220,
    transport: 100,
  })

  await supabase
    .from('activities')
    .insert(DEMO_ACTIVITIES.map((a) => ({ ...a, country_id: country.id })))

  return trip
}
