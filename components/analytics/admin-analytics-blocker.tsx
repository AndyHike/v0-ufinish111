"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function AdminAnalyticsBlocker() {
  const pathname = usePathname()

  useEffect(() => {
    // Перевіряємо чи це адмін або auth сторінка
    const isAdminPage = pathname?.includes("/admin")
    const isAuthPage = pathname?.includes("/auth")

    if ((isAdminPage || isAuthPage) && typeof window !== "undefined") {
      // Відключаємо ecommerce tracking для адмін сторінок
      if (window.gtag) {
        window.gtag("config", "G-WZ0WCH73XT", {
          send_page_view: false,
          allow_enhanced_conversions: false,
          allow_ad_personalization_signals: false,
          enhanced_ecommerce: false,
          ecommerce: false,
        })
      }

      // Блокуємо всі GA ecommerce події
      const originalGtag = window.gtag
      if (originalGtag) {
        window.gtag = function (...args: any[]) {
          // Блокуємо ecommerce події
          if (
            args[0] === "event" &&
            (args[1]?.includes("purchase") ||
              args[1]?.includes("add_to_cart") ||
              args[1]?.includes("remove_from_cart") ||
              args[1]?.includes("view_item") ||
              args[1]?.includes("begin_checkout") ||
              args[2]?.ecommerce)
          ) {
            return // Блокуємо ecommerce події
          }

          // Дозволяємо інші події
          return originalGtag.apply(this, args)
        }
      }
    }
  }, [pathname])

  return null
}
