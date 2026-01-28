'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Skip tracking for admin pages
    if (pathname.includes('/admin')) {
      console.log('[v0] Admin page detected. Skipping analytics tracking.')
      return
    }

    const trackPageView = async () => {
      try {
        console.log('[v0] Tracking page view:', pathname)

        const response = await fetch('/api/analytics/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: pathname,
          }),
          keepalive: true,
        })

        if (!response.ok) {
          const error = await response.text()
          console.error('[v0] Analytics ping failed:', response.status, error)
        } else {
          const result = await response.json()
          console.log('[v0] Analytics ping successful. Online now:', result.onlineNow)
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
