import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Eigene Supabase-Instanz für Reset Password - verhindert Konflikte mit authStore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const resetSupabase = createClient(supabaseUrl, supabaseAnonKey)

type PageState = 'loading' | 'ready' | 'saving' | 'success' | 'error'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const hasInitialized = useRef(false)

  const [pageState, setPageState] = useState<PageState>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verhindere doppelte Initialisierung (React Strict Mode)
    if (hasInitialized.current) return
    hasInitialized.current = true

    const initializeRecovery = async () => {
      // Prüfe zuerst ob wir einen Hash-Token in der URL haben
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      console.log('Recovery init - type:', type, 'hasToken:', !!accessToken)

      // Wenn es ein Recovery-Token gibt, setze die Session manuell
      if (accessToken && type === 'recovery') {
        const refreshToken = hashParams.get('refresh_token') || ''

        const { data, error } = await resetSupabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          console.error('Session set error:', error)
          setError('Der Link ist ungültig oder abgelaufen.')
          setPageState('error')
          return
        }

        if (data.session) {
          console.log('Recovery session established for:', data.session.user.email)
          // URL bereinigen (Hash entfernen)
          window.history.replaceState(null, '', window.location.pathname)
          setPageState('ready')
          return
        }
      }

      // Fallback: Prüfe ob bereits eine Session existiert
      const { data: { session } } = await resetSupabase.auth.getSession()

      if (session) {
        console.log('Existing session found for:', session.user.email)
        setPageState('ready')
      } else {
        console.log('No valid session found')
        setError('Ungültiger oder abgelaufener Link. Bitte fordere einen neuen an.')
        setPageState('error')
      }
    }

    initializeRecovery()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben')
      return
    }

    // Hole aktuelle Session für den Token
    const { data: { session } } = await resetSupabase.auth.getSession()
    if (!session) {
      setError('Session abgelaufen. Bitte fordere einen neuen Link an.')
      setPageState('error')
      return
    }

    setPageState('saving')

    try {
      // SDK Call auf eigener Supabase-Instanz (ohne authStore Listener)
      const { error: updateError } = await resetSupabase.auth.updateUser({ password })

      if (updateError) {
        throw new Error(updateError.message)
      }

      console.log('Password updated successfully')
      setPageState('success')
    } catch (err) {
      console.error('Password update error:', err)
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
      setPageState('ready')
    }
  }

  // Nach Erfolg: Ausloggen und zum Login weiterleiten
  useEffect(() => {
    if (pageState === 'success') {
      const timer = setTimeout(() => {
        resetSupabase.auth.signOut().finally(() => {
          window.location.href = '/login'
        })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [pageState])

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Link wird geprüft...</CardTitle>
            <CardDescription>Bitte warte einen Moment.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Link ungültig</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/forgot-password')}>
              Neuen Link anfordern
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Passwort geändert</CardTitle>
            <CardDescription>
              Dein Passwort wurde erfolgreich geändert. Du wirst zum Login weitergeleitet...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Neues Passwort</CardTitle>
          <CardDescription>Gib dein neues Passwort ein</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mindestens 8 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={pageState === 'saving'}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={pageState === 'saving'}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={pageState === 'saving'}>
              {pageState === 'saving' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                'Passwort speichern'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
