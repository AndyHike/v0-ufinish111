'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function AnalyticsTracker() {
  const pathname = usePathname()
  const sessionIdRef = useRef<string>('')

  useEffect(() => {
    // Generate session ID on first load
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      console.log('[v0] Session ID created:', sessionIdRef.current)
    }

    const trackPageView = async () => {
      try {
        console.log('[v0] Tracking page view:', { page: pathname, sessionId: sessionIdRef.current })
        
        const response = await fetch('/api/analytics/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: pathname,
            sessionId: sessionIdRef.current,
          }),
          keepalive: true,
        })

        if (!response.ok) {
          const error = await response.text()
          console.error('[v0] Analytics ping failed:', response.status, error)
        } else {
          console.log('[v0] Analytics ping successful')
        }
      } catch (error) {
        console.error('[v0] Analytics tracking error:', error)
      }
    }

    trackPageView()

    // Set up heartbeat every 60 seconds
    const interval = setInterval(trackPageView, 60 * 1000)

    return () => clearInterval(interval)
  }, [pathname])

  return null
}
