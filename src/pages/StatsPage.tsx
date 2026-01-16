import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Loader2, Users, AppWindow, LogIn } from 'lucide-react'

type Stats = {
  totalUsers: number
  adminUsers: number
  totalApps: number
  activeApps: number
  loginsLast7Days: number
  loginsLast30Days: number
}

export function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get user counts
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        const { count: adminUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin')

        // Get app counts
        const { count: totalApps } = await supabase
          .from('apps')
          .select('*', { count: 'exact', head: true })

        const { count: activeApps } = await supabase
          .from('apps')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        // Get login stats
        const last7Days = new Date()
        last7Days.setDate(last7Days.getDate() - 7)

        const last30Days = new Date()
        last30Days.setDate(last30Days.getDate() - 30)

        const { count: loginsLast7Days } = await supabase
          .from('login_stats')
          .select('*', { count: 'exact', head: true })
          .gte('logged_in_at', last7Days.toISOString())

        const { count: loginsLast30Days } = await supabase
          .from('login_stats')
          .select('*', { count: 'exact', head: true })
          .gte('logged_in_at', last30Days.toISOString())

        setStats({
          totalUsers: totalUsers || 0,
          adminUsers: adminUsers || 0,
          totalApps: totalApps || 0,
          activeApps: activeApps || 0,
          loginsLast7Days: loginsLast7Days || 0,
          loginsLast30Days: loginsLast30Days || 0,
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Statistiken</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              davon {stats?.adminUsers} Admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apps</CardTitle>
            <AppWindow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeApps}</div>
            <p className="text-xs text-muted-foreground">
              von {stats?.totalApps} aktiv
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logins (7 Tage)</CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.loginsLast7Days}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.loginsLast30Days} in 30 Tagen
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
