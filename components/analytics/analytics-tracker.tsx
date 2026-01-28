'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Track initial page view
    const trackPageView = async () => {
      if (pathname === lastTrackedPathRef.current) return;

      try {
        await fetch('/api/analytics/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pagePath: pathname,
            referrer: document.referrer,
          }),
          keepalive: true,
        });

        lastTrackedPathRef.current = pathname;
      } catch (error) {
        console.error('[Analytics] Failed to track page view:', error);
      }
    };

    trackPageView();

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Send heartbeat ping every 60 seconds to track active time
    intervalRef.current = setInterval(async () => {
      try {
        await fetch('/api/analytics/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pagePath: pathname,
            referrer: document.referrer,
          }),
          keepalive: true,
        });
      } catch (error) {
        console.error('[Analytics] Heartbeat ping failed:', error);
      }
    }, 60000); // 60 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pathname]);

  return null;
}
