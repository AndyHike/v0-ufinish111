import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { createClient } from "@/utils/supabase/server"

// Create the next-intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ["uk", "cs", "en"],
  defaultLocale: "uk",
  localePrefix: "always",
})

async function getDefaultLanguage(): Promise<string> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", "default_language").single()

    if (error || !data) {
      return "uk"
    }

    return data.value || "uk"
  } catch (error) {
    console.error("Error fetching default language:", error)
    return "uk"
  }
}

async function isMaintenanceModeEnabled(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "maintenance_mode_enabled")
      .single()

    if (error || !data) {
      return false
    }

    return data.value === "true"
  } catch (error) {
    console.error("Error checking maintenance mode:", error)
    return false
  }
}

async function getUserRole(supabase: any): Promise<string | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (roleError || !roleData) {
      return null
    }

    return roleData.role
  } catch (error) {
    console.error("Error getting user role:", error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const supportedLocales = ["uk", "cs", "en"]

  // Skip API routes and webhooks
  if (pathname.startsWith("/api/") || pathname.includes("/webhooks/") || pathname.startsWith("/app/api/")) {
    return NextResponse.next()
  }

  // Check maintenance mode
  const maintenanceEnabled = await isMaintenanceModeEnabled()

  if (maintenanceEnabled) {
    const supabase = createClient()
    const userRole = await getUserRole(supabase)
    const isAdmin = userRole === "admin"

    const isMaintenancePage = pathname.includes("/maintenance")
    const isAuthRoute = pathname.includes("/auth/") || pathname.includes("/login")

    if (!isAdmin && !isMaintenancePage && !isAuthRoute) {
      const locale = pathname.split("/")[1]
      if (supportedLocales.includes(locale)) {
        return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url))
      } else {
        const defaultLanguage = await getDefaultLanguage()
        return NextResponse.redirect(new URL(`/${defaultLanguage}/maintenance`, request.url))
      }
    }
  }

  // Handle locale prefix
  const hasLocalePrefix = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (hasLocalePrefix) {
    const response = intlMiddleware(request)

    // Check protected routes
    if (pathname.includes("/profile") || pathname.includes("/admin")) {
      const supabase = createClient()

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          const locale = pathname.split("/")[1] || "uk"
          const redirectUrl = new URL(`/${locale}/login`, request.url)
          redirectUrl.searchParams.set("redirect", pathname)
          return NextResponse.redirect(redirectUrl)
        }

        // Check admin access
        if (pathname.includes("/admin")) {
          const userRole = await getUserRole(supabase)

          if (userRole !== "admin") {
            const locale = pathname.split("/")[1] || "uk"
            return NextResponse.redirect(new URL(`/${locale}`, request.url))
          }
        }
      } catch (error) {
        console.error("Error verifying session in middleware:", error)
        const locale = pathname.split("/")[1] || "uk"
        const redirectUrl = new URL(`/${locale}/login`, request.url)
        redirectUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return response
  }

  // Handle root path
  if (pathname === "/") {
    const defaultLanguage = await getDefaultLanguage()
    return NextResponse.redirect(new URL(`/${defaultLanguage}`, request.url))
  }

  // Redirect to default locale
  const defaultLanguage = await getDefaultLanguage()
  return NextResponse.redirect(new URL(`/${defaultLanguage}${pathname}`, request.url))
}

export const config = {
  matcher: ["/((?!api|_next|webhooks|.*\\..*).*)", "/"],
}
