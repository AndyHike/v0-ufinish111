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
  const searchParams = request.nextUrl.searchParams
  const hostname = request.headers.get("host") || ""

  // Handle 301 redirects for old URL formats with query parameters
  // Old format: /services/{slug}?model={model} → New format: /services/{slug}/{model}
  const servicesMatch = pathname.match(/^\/([a-z]{2})\/services\/([^/]+)$/)
  if (servicesMatch && searchParams.has("model")) {
    const locale = servicesMatch[1]
    const serviceSlug = servicesMatch[2]
    const modelSlug = searchParams.get("model")

    return NextResponse.redirect(
      new URL(`/${locale}/services/${serviceSlug}/${modelSlug}`, request.url),
      { status: 301 }
    )
  }

  // Force HTTPS redirect for HTTP requests
  if (request.headers.get("x-forwarded-proto") !== "https" && process.env.NODE_ENV === "production") {
    return NextResponse.redirect(
      `https://${request.headers.get("host")}${pathname}${request.nextUrl.search}`,
      { status: 301 }
    )
  }

  // Skip middleware for static files, API routes, webhooks, images, and special files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes("/webhooks/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    /\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot|webp)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Check conditions that require a single unified redirect
  const hasWWW = hostname.startsWith("www.")
  const cleanHostname = hasWWW ? hostname.replace(/^www\./, "") : hostname

  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  // UNIFIED REDIRECT LOGIC: if www present OR locale missing, do ONE 301 redirect with final URL
  if (hasWWW || !pathnameHasLocale) {
    const savedLocale = request.cookies.get("NEXT_LOCALE")?.value
    const preferredLocale = savedLocale && supportedLocales.includes(savedLocale) ? savedLocale : getDefaultLanguage()

    // Build final path: if root path, use /${locale} (WITHOUT trailing slash)
    // Otherwise keep the original path structure
    let finalPath: string
    if (pathname === "/") {
      finalPath = `/${preferredLocale}`
    } else if (!pathnameHasLocale) {
      // Path exists but no locale - prepend locale
      finalPath = `/${preferredLocale}${pathname}`
    } else {
      // Path already has locale, just keep it
      finalPath = pathname
    }

    // Build absolute URL with scheme and proper hostname
    const url = new URL(`https://${cleanHostname}${finalPath}`, request.url)
    url.search = request.nextUrl.search

    const response = NextResponse.redirect(url, { status: 301 })
    response.cookies.set("NEXT_LOCALE", preferredLocale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    })

    // Foward session cookies if they exist in the incoming request
    const sessionId = request.cookies.get("session_id")?.value
    const userRole = request.cookies.get("user_role")?.value

    if (sessionId) {
      response.cookies.set("session_id", sessionId, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      })
    }

    if (userRole) {
      response.cookies.set("user_role", userRole, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      })
    }

    return response
  }

  // Quick locale check without full response building for most requests
  const locale = pathname.split("/")[1]
  if (!supportedLocales.includes(locale)) {
    return NextResponse.next()
  }

  const savedLocale = request.cookies.get("NEXT_LOCALE")?.value

  // Only build response if we need to set cookies
  if (savedLocale !== locale && supportedLocales.includes(locale)) {
    const response = NextResponse.next()
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    })
    return response
  }

  // Auth checks for protected routes
  if (pathname.includes("/profile") || pathname.includes("/admin")) {
    const sessionId = request.cookies.get("session_id")?.value

    if (!sessionId) {
      const loginUrl = new URL(`/${locale}/auth/login`, request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl, { status: 307 })
    }
  }

  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
    if (!pathname.includes("/maintenance") && !isPublicAuthRoute(pathname)) {
      const isAdmin = request.cookies.get("user_role")?.value === "admin"
      if (!isAdmin) {
        return NextResponse.redirect(new URL(`/${locale}/maintenance`, request.url), { status: 307 })
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths including root
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)",
  ],
}
