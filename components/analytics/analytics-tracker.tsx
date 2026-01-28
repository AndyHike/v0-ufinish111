'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pagePath: pathname }),
          keepalive: true,
        })
      } catch (error) {
        console.error('[v0] Analytics tracking failed:', error)
      }
    }

    trackPageView()

    // Set up heartbeat every 60 seconds
    const interval = setInterval(trackPageView, 60 * 1000)

    return () => clearInterval(interval)
  }, [pathname])

  return null
}
