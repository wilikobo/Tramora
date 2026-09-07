import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
    })

    return () => {
      active = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [])

  const user = session?.user ?? null
  const userId = user?.id ?? null

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      return null
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, username, avatar_url')
      .eq('user_id', userId)
      .maybeSingle()
    setProfile(data ?? null)
    return data ?? null
  }, [userId])

  useEffect(() => {
    let cancelled = false
    loadProfile().catch(() => {
      if (!cancelled) setProfile(null)
    })
    return () => {
      cancelled = true
    }
  }, [loadProfile])

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      refreshProfile: loadProfile,
      async signIn({ email, password }) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
      },
      async signUp({ email, password, username }) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        })
        if (error) throw error

        const newUser = data.user
        if (newUser) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ user_id: newUser.id, username })
          if (profileError && profileError.code !== '23505') {
            throw profileError
          }
        }
        return data
      },
      async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
    }),
    [session, user, profile, loading, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
