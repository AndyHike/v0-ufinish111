"use client"

import { useEffect } from "react"
import Script from "next/script"

interface GoogleTagProps {
  tagId: string
  consent: boolean
}

export function GoogleTag({ tagId, consent }: GoogleTagProps) {
  useEffect(() => {
    const handleConsentChange = (event: CustomEvent) => {
      const { consent: newConsent, previousConsent } = event.detail

      if (previousConsent?.analytics && !newConsent.analytics) {
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
    return null
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`} strategy="afterInteractive" />
      <Script id="google-tag-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${tagId}');
        `}
      </Script>
    </>
  )
}
