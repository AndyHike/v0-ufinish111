"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

import type { PersonalProfileOffer } from "@/lib/discounts/profile-offers"

const PersonalOfferToast = dynamic(
  () => import("@/components/profile/personal-offer-toast").then((mod) => mod.PersonalOfferToast),
  { ssr: false },
)

interface PersonalOfferToastLoaderProps {
  locale: string
}

type IdleCallbackHandle = number

interface IdleCallbackOptions {
  timeout?: number
}

type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: () => void, options?: IdleCallbackOptions) => IdleCallbackHandle
    cancelIdleCallback?: (handle: IdleCallbackHandle) => void
  }

export function PersonalOfferToastLoader({ locale }: PersonalOfferToastLoaderProps) {
  const [offer, setOffer] = useState<PersonalProfileOffer | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadOffer = async () => {
      try {
        const response = await fetch(`/api/user/personal-offer?locale=${encodeURIComponent(locale)}`, {
          cache: "no-cache",
          credentials: "same-origin",
        })

        if (!response.ok || cancelled) {
          return
        }

        const data = await response.json()
        if (!cancelled) {
          setOffer(data?.offer ?? null)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Personal offer toast failed to load:", error)
        }
      }
    }

    const idleWindow = window as IdleWindow
    const idleHandle =
      typeof idleWindow.requestIdleCallback === "function"
        ? idleWindow.requestIdleCallback(loadOffer, { timeout: 2500 })
        : window.setTimeout(loadOffer, 1400)

    return () => {
      cancelled = true

      if (typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(idleHandle)
      } else {
        window.clearTimeout(idleHandle)
      }
    }
  }, [locale])

  if (!offer) {
    return null
  }

  return <PersonalOfferToast offer={offer} locale={locale} />
}
