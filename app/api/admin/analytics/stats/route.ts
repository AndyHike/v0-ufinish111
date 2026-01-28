import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { activeSessions } from '@/app/api/analytics/ping/route'

export async function GET() {
  try {
    const supabase = await createClient()
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    console.log('[v0] Fetching analytics for date range:', { today, sevenDaysAgo })

    // ============================================
    // ONLINE NOW: Count unique visitorHash from in-memory Map
    // Each entry = 1 unique visitor (F5 reloads don't create duplicates)
    // ============================================
    const onlineNow = activeSessions.size
    console.log(`[v0] Online Now (from in-memory Map): ${onlineNow}`)

    // Get today's page views from database
    const { data: todayViews, error: todayError } = await supabase
      .from('page_views')
      .select('page_path, visitor_hash, created_at')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (todayError) {
      console.error('[v0] Error fetching today views:', todayError)
      throw todayError
    }

    console.log('[v0] Today views fetched:', todayViews?.length)

    // Get 7-day stats
    const { data: weekViews, error: weekError } = await supabase
      .from('page_views')
      .select('page_path, created_at')
      .gte('created_at', `${sevenDaysAgo}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (weekError) {
      console.error('[v0] Error fetching week views:', weekError)
      throw weekError
    }

    console.log('[v0] Week views fetched:', weekViews?.length)

    // Calculate stats
    const totalPageViews = todayViews?.length || 0
    const uniqueVisitors = new Set(todayViews?.map((v) => v.visitor_hash) || []).size

    // Top pages
    const pageViewMap = new Map<string, number>()
    todayViews?.forEach((view) => {
      pageViewMap.set(view.page_path, (pageViewMap.get(view.page_path) || 0) + 1)
    })

    const topPages = Array.from(pageViewMap.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // Weekly trend
    const dailyStats = new Map<string, number>()
    weekViews?.forEach((view) => {
      const date = view.created_at.split('T')[0]
      dailyStats.set(date, (dailyStats.get(date) || 0) + 1)
    })

    const weekly = Array.from(dailyStats.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date))

    console.log('[v0] Analytics calculated:', { onlineNow, totalPageViews, uniqueVisitors })

    return NextResponse.json({
      onlineNow,
      totalPageViewsToday: totalPageViews,
      uniqueVisitorsToday: uniqueVisitors,
      popularPages: topPages,
      weekly,
      debug: {
        mapSize: activeSessions.size,
        sessions: Array.from(activeSessions.entries()).map(([hash, session]) => ({
          hash: hash.substring(0, 8) + '...',
          lastSeen: new Date(session.lastSeen).toISOString(),
          pageCount: session.pageCount,
        })),
      },
    })
  } catch (error) {
    console.error('[v0] Analytics error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
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
