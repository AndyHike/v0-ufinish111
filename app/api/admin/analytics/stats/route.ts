import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get today's page views
    const { data: todayViews, error: todayError } = await supabase
      .from('page_views')
      .select('page_path, visitor_hash, created_at')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (todayError) throw todayError

    // Get 7-day stats
    const { data: weekViews, error: weekError } = await supabase
      .from('page_views')
      .select('page_path, created_at')
      .gte('created_at', `${sevenDaysAgo}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (weekError) throw weekError

    // Get active sessions (last 2 minutes)
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString()
    const { data: activeSessions, error: sessionError } = await supabase
      .from('page_views')
      .select('session_id')
      .gt('created_at', twoMinutesAgo)

    if (sessionError) throw sessionError

    // Calculate stats
    const totalPageViews = todayViews?.length || 0
    const uniqueVisitors = new Set(todayViews?.map((v) => v.visitor_hash) || []).size
    const onlineNow = new Set(activeSessions?.map((s) => s.session_id) || []).size

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

    return NextResponse.json({
      onlineNow,
      totalPageViewsToday: totalPageViews,
      uniqueVisitorsToday: uniqueVisitors,
      popularPages: topPages,
      weekly,
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
