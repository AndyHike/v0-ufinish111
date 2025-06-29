"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/router"
import Script from "next/script"

interface GoogleTagManagerProps {
  gtmId: string
}

const GoogleTagManager: React.FC<GoogleTagManagerProps> = ({ gtmId }) => {
  const router = useRouter()

  useEffect(() => {
    if (!gtmId) {
      console.error("GTM ID is missing. Google Tag Manager will not be initialized.")
      return
    }

    // Function to push the event to the data layer
    const pushToDataLayer = (dataLayer: any) => {
      if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push(dataLayer)
      } else {
        console.error("dataLayer is not available.")
      }
    }

    // Function to handle page view events
    const handleRouteChange = (url: string) => {
      pushToDataLayer({
        event: "pageview",
        page: url,
      })
    }

    // Subscribe to route changes
    router.events.on("routeChangeComplete", handleRouteChange)

    // Initial page view event
    handleRouteChange(router.asPath)

    // Clean up subscription
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange)
    }
  }, [router.events, router.asPath, gtmId])

  if (!gtmId) {
    return null
  }

  return (
    <>
      <Script id="gtm-script" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        ></iframe>
      </noscript>
    </>
  )
}

export default GoogleTagManager
