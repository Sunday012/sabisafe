import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export interface AccountState {
  configured: boolean
  loading: boolean
  user: User | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (name: string, email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export function useAccount(): AccountState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) { setUser(data.session?.user ?? null); setLoading(false) }
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return 'Account sync has not been configured yet.'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async (name: string, email: string, password: string) => {
    if (!supabase) return 'Account sync has not been configured yet.'
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
    if (error) return error.message
    return data.session ? null : 'Check your email to confirm your account, then log in.'
  }

  const signOut = async () => { if (supabase) await supabase.auth.signOut() }

  return { configured: isSupabaseConfigured, loading, user, signIn, signUp, signOut }
}
