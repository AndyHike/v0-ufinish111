"use client"

import { useEffect } from "react"

interface GoogleTagManagerProps {
  gtmId: string
  consent: boolean
}

declare global {
  interface Window {
    dataLayer: any[]
  }
}

export function GoogleTagManager({ gtmId, consent }: GoogleTagManagerProps) {
  useEffect(() => {
    if (!consent || !gtmId) return

    // Перевіряємо чи вже завантажений GTM
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${gtmId}"]`)

    if (!existingScript) {
      // Ініціалізуємо dataLayer
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        "gtm.start": new Date().getTime(),
        event: "gtm.js",
      })

      // Створюємо та додаємо скрипт
      const script = document.createElement("script")
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
      script.async = true
      document.head.appendChild(script)

      // Додаємо noscript iframe
      const noscript = document.createElement("noscript")
      const iframe = document.createElement("iframe")
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`
      iframe.height = "0"
      iframe.width = "0"
      iframe.style.display = "none"
      iframe.style.visibility = "hidden"
      noscript.appendChild(iframe)
      document.body.appendChild(noscript)
    }
  }, [gtmId, consent])

  return null
}
