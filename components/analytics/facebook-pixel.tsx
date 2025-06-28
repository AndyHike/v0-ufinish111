"use client"

import { useEffect } from "react"
import Script from "next/script"
import { useCookieConsentContext } from "@/contexts/cookie-consent-context"

interface FacebookPixelProps {
  pixelId: string
}

export function FacebookPixel({ pixelId }: FacebookPixelProps) {
  const { consent } = useCookieConsentContext()

  useEffect(() => {
    if (consent.marketing && pixelId && typeof window !== "undefined") {
      // Initialize Facebook Pixel
      window.fbq("init", pixelId)
      window.fbq("track", "PageView")
    }
  }, [consent.marketing, pixelId])

  if (!consent.marketing || !pixelId) {
    return null
  }

  return (
    <Script
      id="facebook-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  )
}
