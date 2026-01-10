import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"

// Create the next-intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: ["uk", "cs", "en"],
  defaultLocale: "uk",
  localePrefix: "always",
})

// Using environment variables instead for configuration

function getDefaultLanguage(): string {
  // Use environment variable or fallback to "uk"
  return process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "uk"
}

function isMaintenanceModeEnabled(): boolean {
  // Check environment variable for maintenance mode
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const supportedLocales = ["uk", "cs", "en"]

  // Add exceptions for API routes and webhooks
  if (pathname.startsWith("/api/") || pathname.includes("/webhooks/") || pathname.startsWith("/app/api/")) {
    return NextResponse.next()
  }

  if (pathname.includes("/auth/") || pathname.includes("/login")) {
    const sessionId = request.cookies.get("session_id")?.value

    // If user already has a session cookie, allow access
    if (sessionId) {
      return intlMiddleware(request)
    } else {
      // For users without session - redirect to home
      const locale = pathname.split("/")[1]
      const validLocale = supportedLocales.includes(locale) ? locale : getDefaultLanguage()
      return NextResponse.redirect(new URL(`/${validLocale}`, request.url))
    }
  }

  const maintenanceEnabled = isMaintenanceModeEnabled()

  if (maintenanceEnabled) {
    const sessionId = request.cookies.get("session_id")?.value

    // Admin status should be set as a cookie when user logs in
    const isAdmin = request.cookies.get("user_role")?.value === "admin"

    const isMaintenancePage = pathname.includes("/maintenance")
    const isAuthRoute = pathname.includes("/auth/")

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
          const defaultLanguage = getDefaultLanguage()
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

    // Actual session validation should happen on the page/API route level
    if (pathname.includes("/profile") || pathname.includes("/admin")) {
      const sessionId = request.cookies.get("session_id")?.value

      if (!sessionId) {
        // Get locale from URL
        const locale = pathname.split("/")[1] || "uk"

        // Redirect to home page
        return NextResponse.redirect(new URL(`/${locale}`, request.url))
      }
    }

    return response
  }

  // ONLY apply locale redirection if pathname does NOT have a locale prefix

  // Special handling for root path
  if (pathname === "/") {
    const defaultLanguage = getDefaultLanguage()
    return NextResponse.redirect(new URL(`/${defaultLanguage}`, request.url))
  }

  // For any other path without locale prefix, redirect to default locale + path
  const defaultLanguage = getDefaultLanguage()
  return NextResponse.redirect(new URL(`/${defaultLanguage}${pathname}`, request.url))
}

export const config = {
  matcher: ["/((?!api|_next|webhooks|.*\\..*).*)", "/"],
}
