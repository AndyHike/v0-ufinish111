import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase"

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
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

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Add exceptions for API routes and webhooks
  if (pathname.startsWith("/api/") || pathname.includes("/webhooks/") || pathname.startsWith("/app/api/")) {
    return NextResponse.next()
  }

  // Special handling for root path
  if (pathname === "/") {
    // Get default language from database
    const defaultLanguage = await getDefaultLanguage()
    return NextResponse.redirect(new URL(`/${defaultLanguage}`, request.url))
  }

  // Handle internationalization
  const response = intlMiddleware(request)

  // Check for protected routes
  if (pathname.includes("/profile") || pathname.includes("/admin")) {
    const sessionId = request.cookies.get("session_id")?.value

    if (!sessionId) {
      // Get locale from URL
      const locale = pathname.split("/")[1] || "uk"

      // Redirect to login page
      const redirectUrl = new URL(`/${locale}/auth/login`, request.url)
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
        const redirectUrl = new URL(`/${locale}/auth/login`, request.url)
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

export const config = {
  matcher: ["/((?!api|_next|webhooks|.*\\..*).*)", "/"],
}
