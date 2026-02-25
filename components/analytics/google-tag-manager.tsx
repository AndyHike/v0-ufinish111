"use client"

import Script from "next/script"

// Google Ads conversion tracking ID
const GOOGLE_ADS_ID = "AW-17499950988"

declare global {
  interface Window {
    dataLayer: any[]
    gtag?: (...args: any[]) => void
  }
}

export function GoogleTagManager() {
  return (
    <>
      {/* Google Ads Tag (gtag.js) - завантажується завжди з Consent Mode v2 */}
      <Script
        id="google-ads-tag"
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      
      {/* Конфігурація Google Ads та ініціалізація gtag функції */}
      <Script
        id="google-ads-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `,
        }}
      />
    </>
  )
}
