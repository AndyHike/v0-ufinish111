import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { createClient } from "@/lib/supabase"
import { middlewareCache } from "@/lib/cache-middleware"

const intlMiddleware = createIntlMiddleware({
  locales: ["uk", "cs", "en"],
  defaultLocale: "uk",
  localePrefix: "always",
})

async function getCachedDefaultLanguage(): Promise<string> {
  const cached = middlewareCache.get("default_language")
  if (cached) return cached

  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", "default_language").single()

    const language = error || !data ? "uk" : data.value || "uk"
    middlewareCache.set("default_language", language, 300) // 5 хвилин
    return language
  } catch (error) {
    console.error("Error fetching default language:", error)
    return "uk"
  }
}

async function getCachedMaintenanceMode(): Promise<boolean> {
  const cached = middlewareCache.get("maintenance_mode")
  if (cached !== null) return cached

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "maintenance_mode_enabled")
      .single()

    const maintenanceMode = error || !data ? false : data.value === "true"
    middlewareCache.set("maintenance_mode", maintenanceMode, 60) // 1 хвилина
    return maintenanceMode
  } catch (error) {
    console.error("Error checking maintenance mode:", error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const supportedLocales = ["uk", "cs", "en"]

  // Швидкий вихід для статичних ресурсів
  if (
    pathname.startsWith("/api/") ||
    pathname.includes("/webhooks/") ||
    pathname.startsWith("/app/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Кешовані запити замість прямих
  const [defaultLanguage, maintenanceEnabled] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedMaintenanceMode(),
  ])

  if (maintenanceEnabled) {
    const isMaintenancePage = pathname.includes("/maintenance")
    const isAuthRoute = pathname.includes("/auth/")

    if (!isMaintenancePage && !isAuthRoute) {
      const locale = pathname.split("/")[1]
      if (supportedLocales.includes(locale)) {
        return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url))
      } else {
        return NextResponse.redirect(new URL(`/${defaultLanguage}/maintenance`, request.url))
      }
    }
  }

  const hasLocalePrefix = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (hasLocalePrefix) {
    return intlMiddleware(request)
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${defaultLanguage}`, request.url))
  }

  return NextResponse.redirect(new URL(`/${defaultLanguage}${pathname}`, request.url))
}

export const config = {
  matcher: ["/((?!api|_next|webhooks|.*\\..*).*)", "/"],
}
