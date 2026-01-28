import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// In-memory session manager for real-time tracking
class SessionManager {
  private sessions = new Map<string, { lastSeen: Date }>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanup()
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      const TTL = 2 * 60 * 1000 // 2 minutes in milliseconds

      for (const [key, session] of this.sessions.entries()) {
        if (now - session.lastSeen.getTime() > TTL) {
          this.sessions.delete(key)
        }
      }
    }, 60 * 1000) // Cleanup every minute
  }

  addSession(key: string): boolean {
    const isNew = !this.sessions.has(key)
    this.sessions.set(key, { lastSeen: new Date() })
    return isNew
  }

  getActiveSessions(): number {
    return this.sessions.size
  }

  getActivePages(): Map<string, number> {
    const pages = new Map<string, number>()
    for (const key of this.sessions.keys()) {
      const [, path] = key.split('::')
      pages.set(path, (pages.get(path) || 0) + 1)
    }
    return pages
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Global session manager instance
const sessionManager = new SessionManager()

function maskIP(ip: string): string {
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`
  }
  // For IPv6, mask last 64 bits
  return ip.substring(0, ip.lastIndexOf(':') + 1) + '0000:0000'
}

function generateVisitorHash(
  maskedIP: string,
  userAgent: string,
  date: string,
  salt: string
): string {
  const data = `${maskedIP}::${userAgent}::${date}::${salt}`
  return crypto.createHash('sha256').update(data).digest('hex')
}

export async function POST(request: Request) {
  try {
    const { pagePath } = await request.json()

    if (!pagePath || typeof pagePath !== 'string') {
      return Response.json(
        { error: 'Invalid pagePath' },
        { status: 400 }
      )
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               '0.0.0.0'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const salt = process.env.ANALYTICS_SALT || 'default-salt'

    // Get current date
    const now = new Date()
    const date = now.toISOString().split('T')[0]

    // Generate anonymized visitor hash
    const maskedIP = maskIP(ip)
    const visitorHash = generateVisitorHash(maskedIP, userAgent, date, salt)

    // Track in-memory session
    const sessionKey = `${visitorHash}::${pagePath}`
    const isNewSession = sessionManager.addSession(sessionKey)

    // Persist to database
    await supabase.rpc('increment_page_view', {
      p_date: date,
      p_path: pagePath,
      p_visitor_hash: visitorHash,
    })

    return Response.json(
      {
        success: true,
        isNewSession,
        activeSessions: sessionManager.getActiveSessions(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Analytics] Error:', error)
    return Response.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    )
  }
}

// Export session manager for stats endpoint
export { sessionManager }
