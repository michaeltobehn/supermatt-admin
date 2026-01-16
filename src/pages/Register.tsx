import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'

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

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const { signUpWithEmail, isLoading } = useAuthStore()

  // SSO Redirect URL aus Query Parameter (nur wenn in Whitelist)
  const rawRedirectUrl = searchParams.get('redirect')
  const redirectUrl = rawRedirectUrl && isAllowedRedirect(rawRedirectUrl) ? rawRedirectUrl : null

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwoerter stimmen nicht ueberein')
      return
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben')
      return
    }

    const { error } = await signUpWithEmail(email, password, fullName)
    if (error) {
      setError(error.message)
    } else {
      // Speichere redirect URL für nach der Email-Bestätigung
      if (redirectUrl) {
        localStorage.setItem('sso_redirect_after_confirm', redirectUrl)
      }
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email bestaetigen</CardTitle>
            <CardDescription>
              Wir haben eine Bestaetigungs-Email an <strong>{email}</strong> gesendet.
              Bitte klicke auf den Link in der Email um deinen Account zu aktivieren.
              {redirectUrl && (
                <span className="block mt-2 text-primary">
                  Nach der Bestaetigung wirst du automatisch weitergeleitet.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}>
              <Button variant="outline">Zurueck zum Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Account erstellen</CardTitle>
          <CardDescription>
            Registriere dich fuer deinen SUPERMATT Account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Max Mustermann"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

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
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mindestens 8 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestaetigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Wird erstellt...
                </>
              ) : (
                'Registrieren'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Bereits einen Account?{' '}
            <Link
              to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
              className="text-primary hover:underline"
            >
              Anmelden
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
