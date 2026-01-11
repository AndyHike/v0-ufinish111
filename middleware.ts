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

function isPublicAuthRoute(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(cs|uk|en)/, "")
  return PUBLIC_AUTH_ROUTES.some((route) => pathWithoutLocale.startsWith(route))
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

  // Check if pathname has locale
  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  // If no locale, redirect with locale - single response
  if (!pathnameHasLocale) {
    const savedLocale = request.cookies.get("NEXT_LOCALE")?.value
    const preferredLocale = savedLocale && supportedLocales.includes(savedLocale) ? savedLocale : getDefaultLanguage()

    const url = new URL(`/${preferredLocale}${pathname}`, request.url)
    url.search = request.nextUrl.search

    const response = NextResponse.redirect(url)
    response.cookies.set("NEXT_LOCALE", preferredLocale, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    })
    return response
  }

  const locale = pathname.split("/")[1]
  const response = NextResponse.next()

  const savedLocale = request.cookies.get("NEXT_LOCALE")?.value
  if (savedLocale !== locale && supportedLocales.includes(locale)) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    })
  }

  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
    if (!pathname.includes("/maintenance") && !isPublicAuthRoute(pathname)) {
      const isAdmin = request.cookies.get("user_role")?.value === "admin"
      if (!isAdmin) {
        return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url))
      }
    }
  }

  if (!isPublicAuthRoute(pathname) && (pathname.includes("/profile") || pathname.includes("/admin"))) {
    const sessionId = request.cookies.get("session_id")?.value
    if (!sessionId) {
      const loginUrl = new URL(`/${locale}/auth/login`, request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)",
  ],
}
