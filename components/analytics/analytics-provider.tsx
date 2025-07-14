"use client"

import { useEffect, useState } from "react"
import { FacebookPixel } from "./facebook-pixel"
import { useCookieConsent } from "@/hooks/use-cookie-consent"

export function AnalyticsProvider() {
  const [pixelId, setPixelId] = useState("1707859576556389")
  const { consent } = useCookieConsent()

  useEffect(() => {
    fetch("/api/admin/cookie-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.facebook_pixel_id) {
          setPixelId(data.facebook_pixel_id)
        }
      })
      .catch(() => {})
  }, [])

  return <FacebookPixel pixelId={pixelId} consent={consent.marketing} />
}
