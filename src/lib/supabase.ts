import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  organisation: string | null
  title: string | null
  created_at: string
  updated_at: string
}

export type App = {
  id: string
  name: string
  slug: string
  url: string
  icon: string | null
  description: string | null
  is_active: boolean
  created_at: string
}

export type UserAppAccess = {
  id: string
  user_id: string
  app_id: string
  granted_at: string
  granted_by: string | null
}

export type LoginStat = {
  id: string
  user_id: string
  app_id: string | null
  logged_in_at: string
  ip_address: string | null
  user_agent: string | null
}
