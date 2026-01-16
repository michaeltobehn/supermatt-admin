import { create } from 'zustand'
import { supabase, type Profile } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signInWithOAuth: (provider: 'google' | 'github' | 'apple') => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    // Listen for auth changes first
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null, session })

      if (session) {
        // Profile im Hintergrund laden, nicht blockieren
        get().fetchProfile()
      } else {
        set({ profile: null })
      }
    })

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        set({ user: session.user, session })
        // Profile im Hintergrund laden, nicht blockieren
        get().fetchProfile()
      }
    } finally {
      set({ isLoading: false, isInitialized: true })
    }
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error: error ? new Error(error.message) : null }
    } finally {
      set({ isLoading: false })
    }
  },

  signUpWithEmail: async (email, password, fullName) => {
    set({ isLoading: true })
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      return { error: error ? new Error(error.message) : null }
    } finally {
      set({ isLoading: false })
    }
  },

  signInWithOAuth: async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error ? new Error(error.message) : null }
  },

  signOut: async () => {
    // Sofort UI updaten, nicht auf Netzwerk warten
    set({ user: null, session: null, profile: null, isLoading: false })
    // SignOut im Hintergrund ausfuehren
    supabase.auth.signOut().catch(console.error)
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error: error ? new Error(error.message) : null }
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error: error ? new Error(error.message) : null }
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      set({ profile: data as Profile })
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (!error) {
      await get().fetchProfile()
    }

    return { error: error ? new Error(error.message) : null }
  },
}))
