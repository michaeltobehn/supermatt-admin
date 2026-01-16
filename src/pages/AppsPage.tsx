import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { App } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Pencil, Loader2, Plus, ExternalLink } from 'lucide-react'

export function AppsPage() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [editApp, setEditApp] = useState<App | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchApps = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .order('name')

      if (error) throw error
      setApps(data || [])
    } catch (err) {
      console.error('Error fetching apps:', err)
      setError('Fehler beim Laden der Apps')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
  }, [])

  const handleSaveApp = async () => {
    if (!editApp) return
    setSaving(true)
    setError(null)

    try {
      if (isNew) {
        const { error } = await supabase.from('apps').insert({
          name: editApp.name,
          slug: editApp.slug,
          url: editApp.url,
          icon: editApp.icon,
          description: editApp.description,
          is_active: editApp.is_active,
        })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('apps')
          .update({
            name: editApp.name,
            slug: editApp.slug,
            url: editApp.url,
            icon: editApp.icon,
            description: editApp.description,
            is_active: editApp.is_active,
          })
          .eq('id', editApp.id)
        if (error) throw error
      }

      await fetchApps()
      setEditApp(null)
      setIsNew(false)
    } catch (err) {
      console.error('Error saving app:', err)
      setError('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleNewApp = () => {
    setIsNew(true)
    setEditApp({
      id: '',
      name: '',
      slug: '',
      url: '',
      icon: null,
      description: null,
      is_active: true,
      created_at: '',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Apps</h2>
        <Button onClick={handleNewApp}>
          <Plus className="h-4 w-4 mr-2" />
          Neue App
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm text-muted-foreground">
            {apps.length} Apps konfiguriert
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell className="font-mono text-sm">{app.slug}</TableCell>
                    <TableCell>
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        {app.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          app.is_active
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {app.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsNew(false)
                          setEditApp(app)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {apps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Keine Apps konfiguriert
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/New Dialog */}
      <Dialog open={!!editApp} onOpenChange={() => { setEditApp(null); setIsNew(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? 'Neue App' : 'App bearbeiten'}</DialogTitle>
            <DialogDescription>
              {isNew ? 'Fuege eine neue App hinzu' : `Bearbeite ${editApp?.name}`}
            </DialogDescription>
          </DialogHeader>
          {editApp && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editApp.name}
                  onChange={(e) => setEditApp({ ...editApp, name: e.target.value })}
                  placeholder="SM-TRAX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={editApp.slug}
                  onChange={(e) => setEditApp({ ...editApp, slug: e.target.value })}
                  placeholder="sm-trax"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={editApp.url}
                  onChange={(e) => setEditApp({ ...editApp, url: e.target.value })}
                  placeholder="https://trax.supermatt.agency"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Input
                  id="description"
                  value={editApp.description || ''}
                  onChange={(e) => setEditApp({ ...editApp, description: e.target.value })}
                  placeholder="Zeit- und Projekterfassung"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Aktiv</Label>
                <Switch
                  id="active"
                  checked={editApp.is_active}
                  onCheckedChange={(checked) => setEditApp({ ...editApp, is_active: checked })}
                />
              </div>
              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditApp(null); setIsNew(false) }}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveApp} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
