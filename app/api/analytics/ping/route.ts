import { NextResponse } from 'next/server'
import { pageStats, activeSessions } from '@/app/api/admin/analytics/stats/route'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { page, sessionId } = body

    if (!page) {
      return NextResponse.json({ error: 'Missing page parameter' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Track page view in analytics
    const existingStat = pageStats.find((s) => s.date === today && s.path === page)
    if (existingStat) {
      existingStat.views += 1
    } else {
      pageStats.push({
        path: page,
        date: today,
        views: 1,
        uniqueVisitors: 1,
      })
    }

    // Update active session
    if (sessionId) {
      activeSessions.set(sessionId, {
        sessionId,
        lastSeen: Date.now(),
      })
    }

    return NextResponse.json({
      success: true,
      tracked: true,
    })
  } catch (error) {
    console.error('[v0] Analytics ping error:', error)
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    )
  }
}
