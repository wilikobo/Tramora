import { supabase } from './supabase.js'

const PERSONAL_TRIP_NAME = 'My Journey'

export async function getOrCreatePersonalTrip(userId) {
  if (!userId) throw new Error('No user')

  const { data: existing, error: readError } = await supabase
    .from('trips')
    .select('id, name')
    .eq('user1_id', userId)
    .is('user2_id', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (readError) throw readError
  if (existing) return existing

  const { data: created, error: insertError } = await supabase
    .from('trips')
    .insert({ name: PERSONAL_TRIP_NAME, user1_id: userId })
    .select('id, name')
    .single()

  if (insertError) throw insertError
  return created
}
