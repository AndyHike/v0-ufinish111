"use client"

import { useEffect } from "react"
import Script from "next/script"

interface GoogleTagProps {
  tagId: string
  consent: boolean
}

export function GoogleTag({ tagId, consent }: GoogleTagProps) {
  console.log("🏷️ GoogleTag render:", { tagId, consent })

  useEffect(() => {
    const handleConsentChange = (event: CustomEvent) => {
      const { consent: newConsent, previousConsent } = event.detail

      if (previousConsent?.analytics && !newConsent.analytics) {
        console.log("🔄 Analytics consent revoked, reloading page to clear Google Tag...")
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    }

    window.addEventListener("cookieConsentChanged", handleConsentChange as EventListener)

    return () => {
      window.removeEventListener("cookieConsentChanged", handleConsentChange as EventListener)
    }
  }, [])

  if (!consent) {
    console.log("❌ Google Tag blocked - no analytics consent")
    return null
  }

  console.log("✅ Google Tag loading - analytics consent granted")

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`} strategy="afterInteractive" />
      <Script id="google-tag-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${tagId}');
          console.log('🏷️ Google Tag initialized with ID: ${tagId}');
        `}
      </Script>
    </>
  )
}
