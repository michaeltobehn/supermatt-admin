import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Chrome, Github, Apple, Loader2 } from 'lucide-react'

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

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signInWithEmail, signInWithOAuth, isLoading, user } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // SSO Redirect URL aus Query Parameter (nur wenn in Whitelist)
  const rawRedirectUrl = searchParams.get('redirect')
  const redirectUrl = rawRedirectUrl && isAllowedRedirect(rawRedirectUrl) ? rawRedirectUrl : null

  // Wenn User bereits eingeloggt ist und redirect Parameter existiert, direkt weiterleiten
  useEffect(() => {
    async function handleSSORedirect() {
      if (user && redirectUrl) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          // Redirect mit Token zur aufrufenden App
          const separator = redirectUrl.includes('?') ? '&' : '?'
          window.location.href = `${redirectUrl}${separator}token=${session.access_token}`
        }
      }
    }
    handleSSORedirect()
  }, [user, redirectUrl])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { error } = await signInWithEmail(email, password)
    if (error) {
      setError(error.message)
    } else if (redirectUrl) {
      // SSO Flow: Token holen und zur App redirecten
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const separator = redirectUrl.includes('?') ? '&' : '?'
        window.location.href = `${redirectUrl}${separator}token=${session.access_token}`
      }
    } else {
      navigate('/apps')
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'apple') => {
    setError(null)
    const { error } = await signInWithOAuth(provider)
    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Willkommen</CardTitle>
          <CardDescription>
            Melde dich bei deinem SUPERMATT Account an
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Mit Google anmelden
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin('github')}
              disabled={isLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              Mit GitHub anmelden
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin('apple')}
              disabled={isLoading}
            >
              <Apple className="mr-2 h-4 w-4" />
              Mit Apple anmelden
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                oder mit Email
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Vergessen?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird angemeldet...
                </>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Noch kein Account?{' '}
            <Link
              to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
              className="text-primary hover:underline"
            >
              Registrieren
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
