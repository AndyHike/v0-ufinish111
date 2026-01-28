'use client'

import { useEffect, useState } from 'react'
import { getTodayStats, getWeeklyStats, type StatsOverview, type DailyStats } from '@/lib/analytics/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [weeklyData, setWeeklyData] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [todayStats, weekly] = await Promise.all([
          getTodayStats(),
          getWeeklyStats(),
        ])
        setStats(todayStats)
        setWeeklyData(weekly)
      } catch (error) {
        console.error('[v0] Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30 * 1000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  // Aggregate weekly data for chart
  const chartData = weeklyData.reduce((acc, stat) => {
    const existing = acc.find((item) => item.date === stat.date)
    if (existing) {
      existing.views += stat.view_count
      existing.visitors += stat.unique_visitors
    } else {
      acc.push({
        date: stat.date,
        views: stat.view_count,
        visitors: stat.unique_visitors,
      })
    }
    return acc
  }, [] as Array<{ date: string; views: number; visitors: number }>)

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Online Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.onlineNow || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Page Views Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalPageViewsToday || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.uniqueVisitorsToday || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Traffic Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="currentColor"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="currentColor" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  name="Page Views"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="#10b981"
                  name="Unique Visitors"
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Pages Today</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.popularPages && stats.popularPages.length > 0 ? (
            <div className="space-y-2">
              {stats.popularPages.map((page, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-muted rounded"
                >
                  <span className="text-sm truncate">{page.path}</span>
                  <span className="text-sm font-semibold">{page.views} views</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No page views yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
