import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase, type App } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Clock, BarChart3, ClipboardList, Settings, LogOut, User, BookOpen } from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  clock: <Clock className="h-8 w-8" />,
  chart: <BarChart3 className="h-8 w-8" />,
  clipboard: <ClipboardList className="h-8 w-8" />,
}

export function AppsPage() {
  const navigate = useNavigate()
  const { user, profile, signOut, isLoading } = useAuthStore()
  const [apps, setApps] = useState<App[]>([])
  const [loadingApps, setLoadingApps] = useState(true)

  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/login')
      return
    }

    async function fetchApps() {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (!error && data) {
        setApps(data)
      }
      setLoadingApps(false)
    }

    if (user) {
      fetchApps()
    }
  }, [user, isLoading, navigate])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // Callback-Pfad je nach App-Typ
  const getCallbackPath = (slug: string): string => {
    const callbackPaths: Record<string, string> = {
      // Next.js Apps mit App Router
      'subz': '/api/auth/sso-callback',
      'subz-dev': '/api/auth/sso-callback',
      // TRAX
      'trax': '/sso-callback',
      // Andere Apps (noch nicht implementiert)
      'surveys': '',
    }
    return callbackPaths[slug] ?? '/sso-callback'
  }

  const handleAppClick = async (app: App) => {
    // Get current session token for SSO
    const { data: { session } } = await supabase.auth.getSession()

    const callbackPath = getCallbackPath(app.slug)

    if (session?.access_token && callbackPath) {
      // SSO Login mit Token
      const callbackUrl = `${app.url}${callbackPath}?token=${session.access_token}`
      window.location.href = callbackUrl
    } else {
      // Kein SSO-Callback: Direkt zur App (muss eigene Auth haben)
      window.location.href = app.url
    }
  }

  if (isLoading || loadingApps) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">SUPERMATT</h1>

          <div className="flex items-center gap-4">
            <Link to="/docs">
              <Button variant="ghost" size="sm">
                <BookOpen className="mr-2 h-4 w-4" />
                Docs
              </Button>
            </Link>

            <Link to="/profile">
              <Button variant="ghost" size="sm">
                <User className="mr-2 h-4 w-4" />
                {profile?.full_name || user?.email}
              </Button>
            </Link>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Deine Apps</h2>
          <p className="text-muted-foreground">
            Waehle eine App um zu starten
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Card
              key={app.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleAppClick(app)}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    {iconMap[app.icon || 'clock'] || <Settings className="h-8 w-8" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <CardDescription>{app.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  App oeffnen
                </Button>
              </CardContent>
            </Card>
          ))}

          {apps.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Keine Apps verfuegbar
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
