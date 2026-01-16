import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Whitelist für erlaubte SSO Redirect URLs
const ALLOWED_REDIRECT_ORIGINS = [
  'https://subz.supermatt.agency',
  'https://trax.supermatt.agency',
  'https://supermatt.agency',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
]

function isAllowedRedirect(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_REDIRECT_ORIGINS.some(origin =>
      parsed.origin === origin || parsed.origin === new URL(origin).origin
    )
  } catch {
    return false
  }
}

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the OAuth/Email confirmation callback
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Prüfe ob ein SSO Redirect gespeichert wurde (nach Registrierung)
        const savedRedirect = localStorage.getItem('sso_redirect_after_confirm')
        if (savedRedirect && isAllowedRedirect(savedRedirect)) {
          localStorage.removeItem('sso_redirect_after_confirm')
          // Redirect mit Token zur aufrufenden App
          const separator = savedRedirect.includes('?') ? '&' : '?'
          window.location.href = `${savedRedirect}${separator}token=${session.access_token}`
          return
        }
        navigate('/apps')
      } else {
        navigate('/login')
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Anmeldung wird abgeschlossen...</p>
      </div>
    </div>
  )
}
