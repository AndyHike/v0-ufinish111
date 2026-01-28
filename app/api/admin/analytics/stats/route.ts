import { NextResponse } from 'next/server'

// In-memory storage for demo purposes (in production, use database)
interface PageStat {
  path: string
  date: string
  views: number
  uniqueVisitors: number
}

interface SessionData {
  sessionId: string
  lastSeen: number
}

const pageStats: PageStat[] = []
const activeSessions = new Map<string, SessionData>()

// Cleanup old sessions every minute
setInterval(() => {
  const now = Date.now()
  const TTL = 2 * 60 * 1000 // 2 minutes

  for (const [key, session] of activeSessions.entries()) {
    if (now - session.lastSeen > TTL) {
      activeSessions.delete(key)
    }
  }
}, 60 * 1000)

export async function GET() {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    // Get today's stats
    const todayStats = pageStats.filter((s) => s.date === today)
    const totalPageViews = todayStats.reduce((sum, s) => sum + s.views, 0)
    const uniqueVisitors = new Set(todayStats.map((s) => s.path)).size

    // Get top pages
    const pageViewMap = new Map<string, number>()
    todayStats.forEach((stat) => {
      pageViewMap.set(stat.path, (pageViewMap.get(stat.path) || 0) + stat.views)
    })

    const topPages = Array.from(pageViewMap.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // Get weekly trend
    const weeklyTrend = pageStats
      .filter((s) => s.date >= sevenDaysAgo && s.date <= today)
      .reduce(
        (acc, stat) => {
          const existing = acc.find((item) => item.date === stat.date)
          if (existing) {
            existing.views += stat.views
          } else {
            acc.push({ date: stat.date, views: stat.views })
          }
          return acc
        },
        [] as Array<{ date: string; views: number }>
      )
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      onlineNow: activeSessions.size,
      totalPageViewsToday: totalPageViews,
      uniqueVisitorsToday: uniqueVisitors,
      popularPages: topPages,
      weekly: weeklyTrend,
    })
  } catch (error) {
    console.error('[v0] Analytics error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        onlineNow: 0,
        totalPageViewsToday: 0,
        uniqueVisitorsToday: 0,
        popularPages: [],
        weekly: [],
      },
      { status: 500 }
    )
  }
}

// Export helpers for ping endpoint
export { pageStats, activeSessions }
