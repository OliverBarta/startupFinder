import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// The signed-in Supabase session, shared app-wide.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  // True until Supabase has restored any existing session from storage.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fires once straight away with the stored session (INITIAL_SESSION),
    // then on every sign in, sign out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

// Provider and hook share a file on purpose; edits here do a full reload instead of fast refresh.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
