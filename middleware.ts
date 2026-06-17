import { getB2BRedirectTarget, getB2BRewritePath } from "@/lib/b2b-routing"
import { getShopRedirectTarget, getShopRewritePath, isShopHost } from "@/lib/shop-routing"
import { siteUrl } from "@/lib/site-config"
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

  // Force HTTPS redirect for HTTP requests
  if (request.headers.get("x-forwarded-proto") !== "https" && process.env.NODE_ENV === "production") {
    return NextResponse.redirect(
      `https://${request.headers.get("host")}${pathname}${request.nextUrl.search}`,
      { status: 301 }
    )
  }

  // Skip middleware for static files, internal routes, non-shop API routes, webhooks, images, and special files
  if (
    pathname.startsWith("/_next") ||
    pathname === "/b2b" ||
    pathname.startsWith("/b2b/") ||
    pathname === "/shop" ||
    pathname.startsWith("/shop/") ||
    ((pathname === "/api" || pathname.startsWith("/api/")) && !isShopHost(hostname)) ||
    pathname.includes("/webhooks/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    /\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot|webp)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Shop subdomain API routes (e.g. /api/shop/search) are served directly at
  // their real path — no locale redirect/rewrite — so the storefront can call
  // them same-origin.
  if (isShopHost(hostname) && (pathname === "/api" || pathname.startsWith("/api/"))) {
    return NextResponse.next()
  }

  const b2bRedirectTarget = getB2BRedirectTarget({
    host: hostname,
    pathname,
    search: request.nextUrl.search,
    mainBaseUrl: siteUrl,
  })

  if (b2bRedirectTarget) {
    return NextResponse.redirect(b2bRedirectTarget, { status: 308 })
  }

  const b2bRewritePath = getB2BRewritePath(hostname, pathname)

  if (b2bRewritePath) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = b2bRewritePath
    if (rewriteUrl.hostname === "localhost" || rewriteUrl.hostname === "127.0.0.1") {
      rewriteUrl.protocol = "http:"
    }
    return NextResponse.rewrite(rewriteUrl)
  }

  const shopRedirectTarget = getShopRedirectTarget({
    host: hostname,
    pathname,
    search: request.nextUrl.search,
    mainBaseUrl: siteUrl,
  })

  if (shopRedirectTarget) {
    return NextResponse.redirect(shopRedirectTarget, { status: 308 })
  }

  const shopRewritePath = getShopRewritePath(hostname, pathname)

  if (shopRewritePath) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = shopRewritePath
    if (rewriteUrl.hostname === "localhost" || rewriteUrl.hostname === "127.0.0.1") {
      rewriteUrl.protocol = "http:"
    }
    const response = NextResponse.rewrite(rewriteUrl)
    // TEMP: shop subdomain is still in development — keep every storefront page
    // out of search indexes. Remove this header (and the Disallow in
    // app/robots.txt/route.ts) when the shop goes live.
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    return response
  }

  // Handle 301 redirects for old URL formats with query parameters.
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

    // Use HTTPS for production redirects, but keep the local dev server on HTTP.
    const protocol = process.env.NODE_ENV === "production" ? "https:" : request.nextUrl.protocol
    const url = new URL(`${protocol}//${cleanHostname}${finalPath}`, request.url)
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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)",
  ],
}
