import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

function maskIP(ip: string): string {
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`
  }
  return ip.substring(0, ip.lastIndexOf(':') + 1) + '0000'
}

function generateVisitorHash(maskedIP: string, userAgent: string, date: string, salt: string): string {
  const data = `${maskedIP}::${userAgent}::${date}::${salt}`
  return crypto.createHash('sha256').update(data).digest('hex')
}

// In-memory Map for tracking active sessions
// Key: visitorHash (stable across F5 reloads within the same day)
// Value: { lastSeen: timestamp, pageCount: number }
interface SessionEntry {
  lastSeen: number
  pageCount: number
}

export const activeSessions = new Map<string, SessionEntry>()

// Cleanup old sessions every 30 seconds
const CLEANUP_INTERVAL = 30 * 1000 // 30 seconds
const SESSION_TTL = 2 * 60 * 1000 // 2 minutes

setInterval(() => {
  const now = Date.now()
  let removed = 0

  for (const [hash, session] of activeSessions.entries()) {
    if (now - session.lastSeen > SESSION_TTL) {
      activeSessions.delete(hash)
      removed++
    }
  }

  if (removed > 0) {
    console.log(`[v0] Cleanup: Removed ${removed} expired sessions. Active: ${activeSessions.size}`)
  }
}, CLEANUP_INTERVAL)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { page } = body

    if (!page) {
      console.error('[v0] Missing page parameter')
      return NextResponse.json({ error: 'Missing page parameter' }, { status: 400 })
    }

    // Skip tracking for admin pages
    if (page.includes('/admin')) {
      console.log('[v0] Admin page detected. Skipping analytics tracking.')
      return NextResponse.json({ skipped: true, reason: 'Admin page' })
    }

    const supabase = await createClient()

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const salt = process.env.ANALYTICS_SALT || 'default-salt'
    const today = new Date().toISOString().split('T')[0]

    const maskedIP = maskIP(ip)
    const visitorHash = generateVisitorHash(maskedIP, userAgent, today, salt)

    // ============================================
    // CRITICAL: Use visitorHash as the unique key
    // ============================================
    const now = Date.now()
    const existingSession = activeSessions.get(visitorHash)

    if (existingSession) {
      // F5 RELOAD: Same visitorHash detected
      // Update timestamp instead of creating duplicate
      console.log(`[v0] F5 Reload detected for ${visitorHash.substring(0, 8)}... Updating timestamp.`)
      existingSession.lastSeen = now
      existingSession.pageCount += 1
    } else {
      // NEW SESSION: First ping from this visitor today
      console.log(`[v0] New session: ${visitorHash.substring(0, 8)}... (Total active: ${activeSessions.size + 1})`)
      activeSessions.set(visitorHash, {
        lastSeen: now,
        pageCount: 1,
      })
    }

    // Insert page view into database
    const { error } = await supabase.from('page_views').insert({
      page_path: page,
      visitor_hash: visitorHash,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[v0] Supabase insert error:', error.message)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      tracked: true,
      onlineNow: activeSessions.size,
    })
  } catch (error) {
    console.error('[v0] Analytics ping error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to track page view'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
