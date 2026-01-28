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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { page, sessionId } = body

    console.log('[v0] Analytics ping received:', { page, sessionId })

    if (!page) {
      return NextResponse.json({ error: 'Missing page parameter' }, { status: 400 })
    }

    const supabase = await createClient()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '0.0.0.0'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const salt = process.env.ANALYTICS_SALT || 'default-salt'
    const today = new Date().toISOString().split('T')[0]

    const maskedIP = maskIP(ip)
    const visitorHash = generateVisitorHash(maskedIP, userAgent, today, salt)

    console.log('[v0] Inserting analytics:', { page_path: page, visitor_hash: visitorHash })

    // Insert page view
    const { data, error } = await supabase.from('page_views').insert({
      page_path: page,
      visitor_hash: visitorHash,
      session_id: sessionId,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[v0] Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('[v0] Analytics tracked successfully')
    return NextResponse.json({ success: true, tracked: true })
  } catch (error) {
    console.error('[v0] Analytics ping error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to track page view' }, { status: 500 })
  }
}
