import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { ArrowLeft, Copy, Check, BookOpen, Server, Shield, Code2 } from 'lucide-react'
import { useState } from 'react'

function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-background border rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function DocsPage() {
  const { profile } = useAuthStore()

  const reactExample = `// src/pages/SSOCallback.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function SSOCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('Kein Token vorhanden')
      return
    }

    async function validateToken() {
      try {
        // Token bei Supabase validieren und Session setzen
        const { data, error } = await supabase.auth.setSession({
          access_token: token!,
          refresh_token: '', // Wird von Supabase automatisch geholt
        })

        if (error) throw error

        if (data.user) {
          // Erfolgreich eingeloggt - zur App weiterleiten
          navigate('/dashboard')
        }
      } catch (err) {
        console.error('SSO Error:', err)
        setError('Authentifizierung fehlgeschlagen')
        // Zurueck zum SSO Portal
        setTimeout(() => {
          window.location.href = 'https://auth.supermatt.agency/login'
        }, 2000)
      }
    }

    validateToken()
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-muted-foreground">Weiterleitung zum Login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p>Anmeldung wird verarbeitet...</p>
      </div>
    </div>
  )
}`

  const routeExample = `// App.tsx oder Router-Konfiguration
import { SSOCallbackPage } from './pages/SSOCallback'

// Route hinzufuegen (oeffentlich, kein Auth-Check!)
<Route path="/auth/sso-callback" element={<SSOCallbackPage />} />`

  const supabaseSetup = `// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// WICHTIG: Gleiche Supabase-Instanz wie SSO Portal!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)`

  const envExample = `# .env.local
# WICHTIG: Gleiche Credentials wie SSO Portal!
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

  const nextjsExample = `// app/auth/sso-callback/page.tsx (Next.js App Router)
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SSOCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('Kein Token vorhanden')
      return
    }

    async function validateToken() {
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: token!,
          refresh_token: '',
        })

        if (error) throw error

        if (data.user) {
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('SSO Error:', err)
        setError('Authentifizierung fehlgeschlagen')
        setTimeout(() => {
          window.location.href = 'https://auth.supermatt.agency/login'
        }, 2000)
      }
    }

    validateToken()
  }, [searchParams, router, supabase.auth])

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return <div>Anmeldung wird verarbeitet...</div>
}`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/apps">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurueck
              </Button>
            </Link>
            <h1 className="text-xl font-bold">SSO Integration Guide</h1>
          </div>
          <span className="text-sm text-muted-foreground">
            Eingeloggt als {profile?.full_name || profile?.email}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Intro */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Neue App mit SSO verbinden</h2>
          <p className="text-lg text-muted-foreground">
            Diese Anleitung zeigt, wie du eine neue SUPERMATT-App mit dem zentralen
            Single Sign-On verbindest.
          </p>
        </div>

        {/* Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <Server className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">1. App registrieren</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Administrator kontaktieren, um App zu registrieren
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Code2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">2. Callback implementieren</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                SSO-Callback Route in deiner App erstellen
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">3. Supabase verbinden</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gleiche Supabase-Instanz wie SSO Portal nutzen
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Step 1 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
              App registrieren lassen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Kontaktiere einen Administrator, um deine App im System zu registrieren.
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="font-medium">Name:</span>
                <span>Der Anzeigename (z.B. "SM-TRAX")</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="font-medium">Slug:</span>
                <span>Eindeutiger Bezeichner (z.B. "sm-trax")</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="font-medium">URL:</span>
                <span>Basis-URL der App (z.B. "https://trax.supermatt.agency")</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="font-medium">Beschreibung:</span>
                <span>Kurze Beschreibung fuer das Dashboard</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <BookOpen className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <strong>Wichtig:</strong> Die URL muss ohne abschliessenden Slash eingegeben werden.
                Das Portal leitet zu <code className="bg-muted px-1 rounded">{'{url}'}/auth/sso-callback</code> weiter.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
              Supabase Client konfigurieren
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Deine App muss die <strong>gleiche Supabase-Instanz</strong> wie das SSO Portal nutzen.
              Nur so kann der Token validiert werden.
            </p>
            <div>
              <h4 className="font-medium mb-2">Environment Variables (.env.local)</h4>
              <CodeBlock code={envExample} language="bash" />
            </div>
            <div>
              <h4 className="font-medium mb-2">Supabase Client Setup</h4>
              <CodeBlock code={supabaseSetup} />
            </div>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
              SSO Callback Route implementieren
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>
              Erstelle eine Route unter <code className="bg-muted px-2 py-1 rounded">/auth/sso-callback</code>,
              die den Token aus der URL liest und die Session setzt.
            </p>

            <div>
              <h4 className="font-medium mb-2">React + React Router (Vite)</h4>
              <CodeBlock code={reactExample} />
            </div>

            <div>
              <h4 className="font-medium mb-2">Route registrieren</h4>
              <CodeBlock code={routeExample} />
            </div>

            <div className="flex items-start gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <strong>Sicherheitshinweis:</strong> Die Callback-Route muss oeffentlich zugaenglich sein
                (kein Auth-Check), da der User zu diesem Zeitpunkt noch keine lokale Session hat.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next.js Example */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Beispiel: Next.js App Router
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock code={nextjsExample} />
          </CardContent>
        </Card>

        {/* Flow Diagram */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>SSO Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-6 rounded-lg font-mono text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-primary">1.</span>
                  <span>User klickt auf App im SSO Portal</span>
                </div>
                <div className="flex items-center gap-2 pl-4 text-muted-foreground">
                  <span>↓</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">2.</span>
                  <span>Portal holt Session Token von Supabase</span>
                </div>
                <div className="flex items-center gap-2 pl-4 text-muted-foreground">
                  <span>↓</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">3.</span>
                  <span>Redirect zu: app.url/auth/sso-callback?token=xxx</span>
                </div>
                <div className="flex items-center gap-2 pl-4 text-muted-foreground">
                  <span>↓</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">4.</span>
                  <span>Ziel-App validiert Token via supabase.auth.setSession()</span>
                </div>
                <div className="flex items-center gap-2 pl-4 text-muted-foreground">
                  <span>↓</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary">5.</span>
                  <span>User ist eingeloggt und wird zum Dashboard weitergeleitet</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Haeufige Probleme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-red-500">Token ungueltig / Session wird nicht gesetzt</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Stelle sicher, dass du die gleichen Supabase-Credentials verwendest wie das SSO Portal.
                  Der Token kann nur von der gleichen Supabase-Instanz validiert werden.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-red-500">CORS-Fehler</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Pruefe, ob deine App-Domain in den Supabase Auth-Einstellungen als "Redirect URL"
                  eingetragen ist.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-red-500">Endlosschleife beim Redirect</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Die <code className="bg-muted px-1 rounded">/auth/sso-callback</code> Route darf keinen
                  Auth-Check haben, da der User zu diesem Zeitpunkt noch keine lokale Session besitzt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            Fragen? Kontaktiere das SUPERMATT Team oder schaue in den{' '}
            <a href="https://supabase.com/docs/guides/auth" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Supabase Auth Docs
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
