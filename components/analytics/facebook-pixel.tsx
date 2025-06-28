"use client"

import { useEffect } from "react"
import Script from "next/script"

interface FacebookPixelProps {
  pixelId: string
  consent: boolean
}

export function FacebookPixel({ pixelId, consent }: FacebookPixelProps) {
  useEffect(() => {
    if (consent && pixelId && typeof window !== "undefined") {
      // Ініціалізуємо Facebook Pixel
      window.fbq =
        window.fbq ||
        ((...args: any[]) => {
          if (window.fbq.q) {
            window.fbq.q.push(args)
          }
        })
      window.fbq.q = window.fbq.q || []
      window.fbq.l = +new Date()
      window.fbq("init", pixelId)
      window.fbq("track", "PageView")

      console.log("Facebook Pixel initialized with ID:", pixelId)
    }
  }, [pixelId, consent])

  if (!consent || !pixelId) {
    return null
  }

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
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
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
