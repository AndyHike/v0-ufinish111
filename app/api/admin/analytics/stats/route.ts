import { sessionManager } from '@/app/api/analytics/ping/route'
import { getTodayStats, getWeeklyStats } from '@/lib/analytics/queries'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [todayStats, weeklyStats] = await Promise.all([
      getTodayStats(),
      getWeeklyStats(),
    ])

    const activeSessions = sessionManager.getActiveSessions()
    const activePages = sessionManager.getActivePages()

    return NextResponse.json({
      today: {
        ...todayStats,
        onlineNow: activeSessions,
      },
      weekly: weeklyStats,
      activePages: Array.from(activePages.entries()).map(([path, count]) => ({
        path,
        activeUsers: count,
      })),
    })
  } catch (error) {
    console.error('[Analytics Stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics stats' },
      { status: 500 }
    )
  }
}
