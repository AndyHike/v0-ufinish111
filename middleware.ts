import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const supportedLocales = ["uk", "cs", "en"]
const defaultLocale = "cs"

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
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot|webp)$/)
  ) {
    return NextResponse.next()
  }

  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (pathname === "/") {
    const defaultLanguage = getDefaultLanguage()
    const url = new URL(`/${defaultLanguage}`, request.url)
    return NextResponse.redirect(url)
  }

  if (!pathnameHasLocale && !pathname.startsWith(`/${defaultLocale}`)) {
    const defaultLanguage = getDefaultLanguage()
    const url = new URL(`/${defaultLanguage}${pathname}`, request.url)
    return NextResponse.redirect(url)
  }

  const locale = pathname.split("/")[1]

  const maintenanceEnabled = isMaintenanceModeEnabled()
  if (maintenanceEnabled) {
    const isAdmin = request.cookies.get("user_role")?.value === "admin"
    const isMaintenancePage = pathname.includes("/maintenance")
    const isAuthRoute = pathname.includes("/auth/")

    if (!isAdmin && !isMaintenancePage && !isAuthRoute) {
      const url = new URL(`/${locale}/maintenance`, request.url)
      return NextResponse.redirect(url)
    }
  }

  if (pathname.includes("/auth/")) {
    const sessionId = request.cookies.get("session_id")?.value
    if (sessionId) {
      const url = new URL(`/${locale}`, request.url)
      return NextResponse.redirect(url)
    }
  }

  if (pathname.includes("/profile") || pathname.includes("/admin")) {
    const sessionId = request.cookies.get("session_id")?.value
    if (!sessionId) {
      const url = new URL(`/${locale}/auth/login`, request.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)",
  ],
}
