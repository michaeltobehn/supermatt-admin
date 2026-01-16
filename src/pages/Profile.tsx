import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

export function ProfilePage() {
  const { user, profile, updateProfile, updatePassword, isLoading } = useAuthStore()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)

    const { error } = await updateProfile({ full_name: fullName })
    if (error) {
      setProfileError(error.message)
    } else {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwoerter stimmen nicht ueberein')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Passwort muss mindestens 8 Zeichen haben')
      return
    }

    const { error } = await updatePassword(newPassword)
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/apps" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurueck zu Apps
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Profil Einstellungen</h1>

        <div className="space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Persoenliche Daten</CardTitle>
              <CardDescription>
                Aendere deinen Namen und andere Informationen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email kann nicht geaendert werden
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {profileError && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div className="text-sm text-green-600 bg-green-100 p-3 rounded-md flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Profil aktualisiert
                  </div>
                )}

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    'Speichern'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Passwort aendern</CardTitle>
              <CardDescription>
                Aendere dein Passwort
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mindestens 8 Zeichen"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestaetigen</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    disabled={isLoading}
                  />
                </div>

                {passwordError && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="text-sm text-green-600 bg-green-100 p-3 rounded-md flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Passwort geaendert
                  </div>
                )}

                <Button type="submit" disabled={isLoading || !newPassword}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    'Passwort aendern'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Rolle: <span className="text-foreground font-medium">{profile?.role === 'admin' ? 'Administrator' : 'Benutzer'}</span></p>
              <p>Erstellt: <span className="text-foreground">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('de-DE') : '-'}</span></p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
