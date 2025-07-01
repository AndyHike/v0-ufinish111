import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { createClient } from "@/lib/supabase"

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
      return "uk" // fallback
    }

    return data.value || "uk"
  } catch (error) {
    console.error("Error fetching default language:", error)
    return "uk" // fallback
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

async function isUserAdmin(sessionId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return false
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user_id)
      .single()

    if (userError || !user) {
      return false
    }

    return user.role === "admin"
  } catch (error) {
    console.error("Error checking user admin status:", error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const supportedLocales = ["uk", "cs", "en"]

  // Add exceptions for API routes and webhooks
  if (pathname.startsWith("/api/") || pathname.includes("/webhooks/") || pathname.startsWith("/app/api/")) {
    return NextResponse.next()
  }

  // Check maintenance mode FIRST
  const maintenanceEnabled = await isMaintenanceModeEnabled()

  if (maintenanceEnabled) {
    const sessionId = request.cookies.get("session_id")?.value
    let isAdmin = false

    if (sessionId) {
      isAdmin = await isUserAdmin(sessionId)
    }

    // Allow access to maintenance page and ALL auth routes for everyone
    const isMaintenancePage = pathname.includes("/maintenance")
    const isAuthRoute = pathname.includes("/auth/")
    const isAdminRoute = pathname.includes("/admin")

    if (!isAdmin) {
      // Allow access to maintenance page and auth routes
      if (isMaintenancePage || isAuthRoute) {
        // Continue with normal processing - allow access
      } else {
        // Redirect all other pages to maintenance
        const locale = pathname.split("/")[1]
        if (supportedLocales.includes(locale)) {
          return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url))
        } else {
          const defaultLanguage = await getDefaultLanguage()
          return NextResponse.redirect(new URL(`/${defaultLanguage}/maintenance`, request.url))
        }
      }
    }
    // If user is admin, allow access to everything
  }

  // CRUCIAL CHECK: If pathname already starts with a supported locale, proceed without redirection
  const hasLocalePrefix = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (hasLocalePrefix) {
    // Handle internationalization for paths that already have locale prefix
    const response = intlMiddleware(request)

    // Check for protected routes (only if not in maintenance mode or user is admin)
    if (pathname.includes("/profile") || pathname.includes("/admin")) {
      const sessionId = request.cookies.get("session_id")?.value

      if (!sessionId) {
        // Get locale from URL
        const locale = pathname.split("/")[1] || "uk"

        // Redirect to login page
        const redirectUrl = new URL(`/${locale}/auth/signin`, request.url)
        redirectUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Verify that the session exists in the database and is valid
      try {
        const supabase = createClient()

        const { data: session, error } = await supabase
          .from("sessions")
          .select("id, user_id, expires_at")
          .eq("id", sessionId)
          .single()

        if (error || !session || new Date(session.expires_at) < new Date()) {
          // Session is invalid or expired, redirect to login
          const locale = pathname.split("/")[1] || "uk"
          const redirectUrl = new URL(`/${locale}/auth/signin`, request.url)
          redirectUrl.searchParams.set("redirect", pathname)

          // Clear the invalid session cookie
          const response = NextResponse.redirect(redirectUrl)
          response.cookies.delete("session_id")
          return response
        }
      } catch (error) {
        console.error("Error verifying session in middleware:", error)
      }
    }

    return response
  }

  // ONLY apply locale redirection if pathname does NOT have a locale prefix

  // Special handling for root path
  if (pathname === "/") {
    const defaultLanguage = await getDefaultLanguage()
    return NextResponse.redirect(new URL(`/${defaultLanguage}`, request.url))
  }

  // For any other path without locale prefix, redirect to default locale + path
  const defaultLanguage = await getDefaultLanguage()
  return NextResponse.redirect(new URL(`/${defaultLanguage}${pathname}`, request.url))
}

export const config = {
  matcher: ["/((?!api|_next|webhooks|.*\\..*).*)", "/"],
}
