import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"

const supportedLocales = ["uk", "cs", "en"]
const defaultLocale = "uk"

// Create the next-intl middleware
const intlMiddleware = createIntlMiddleware({
  locales: supportedLocales,
  defaultLocale: defaultLocale,
  localePrefix: "always",
})

function getDefaultLanguage(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_LOCALE || defaultLocale
}

function isMaintenanceModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes("/webhooks/") ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (pathname === "/") {
    const defaultLanguage = getDefaultLanguage()
    return NextResponse.redirect(new URL(`/${defaultLanguage}`, request.url))
  }

  if (!pathnameHasLocale) {
    const defaultLanguage = getDefaultLanguage()
    return NextResponse.redirect(new URL(`/${defaultLanguage}${pathname}`, request.url))
  }

  const locale = pathname.split("/")[1]

  const maintenanceEnabled = isMaintenanceModeEnabled()
  if (maintenanceEnabled) {
    const isAdmin = request.cookies.get("user_role")?.value === "admin"
    const isMaintenancePage = pathname.includes("/maintenance")
    const isAuthRoute = pathname.includes("/auth/")

    if (!isAdmin && !isMaintenancePage && !isAuthRoute) {
      return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url))
    }
  }

  if (pathname.includes("/auth/") || pathname.includes("/login")) {
    const sessionId = request.cookies.get("session_id")?.value
    if (sessionId) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url))
    }
  }

  if (pathname.includes("/profile") || pathname.includes("/admin")) {
    const sessionId = request.cookies.get("session_id")?.value
    if (!sessionId) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
}
