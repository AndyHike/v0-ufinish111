import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const supportedLocales = ["cs", "uk", "en"]
const defaultLocale = "cs"

const PUBLIC_AUTH_ROUTES = [
  "/auth/login",
  "/auth/signin",
  "/auth/register",
  "/auth/verify",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/resend-verification",
  "/auth/verification-success",
  "/auth/verification-error",
]

function getDefaultLanguage(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_LOCALE || defaultLocale
}

function isMaintenanceModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"
}

function isPublicAuthRoute(pathname: string): boolean {
  // Remove locale prefix from pathname for checking
  const pathWithoutLocale = pathname.replace(/^\/(cs|uk|en)/, "")
  return PUBLIC_AUTH_ROUTES.some((route) => pathWithoutLocale.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for static files, API routes, and webhooks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes("/webhooks/") ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot|webp)$/)
  ) {
    return NextResponse.next()
  }

  // Check if pathname has locale
  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  // If no locale, redirect to URL with locale
  if (!pathnameHasLocale) {
    const savedLocale = request.cookies.get("NEXT_LOCALE")?.value
    const preferredLocale = savedLocale && supportedLocales.includes(savedLocale) ? savedLocale : getDefaultLanguage()

    const url = new URL(`/${preferredLocale}${pathname}`, request.url)
    url.search = request.nextUrl.search

    const response = NextResponse.redirect(url)
    response.cookies.set("NEXT_LOCALE", preferredLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    })
    return response
  }

  // Extract locale from pathname
  const locale = pathname.split("/")[1]

  // Update locale cookie if changed
  const savedLocale = request.cookies.get("NEXT_LOCALE")?.value
  const response = NextResponse.next()

  if (savedLocale !== locale && supportedLocales.includes(locale)) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    })
  }

  const maintenanceEnabled = isMaintenanceModeEnabled()
  if (maintenanceEnabled && !pathname.includes("/maintenance") && !isPublicAuthRoute(pathname)) {
    const isAdmin = request.cookies.get("user_role")?.value === "admin"
    if (!isAdmin) {
      return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url))
    }
  }

  if (!isPublicAuthRoute(pathname) && (pathname.includes("/profile") || pathname.includes("/admin"))) {
    const sessionId = request.cookies.get("session_id")?.value
    if (!sessionId) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)",
  ],
}
