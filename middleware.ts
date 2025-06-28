import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode"
import { getToken } from "next-auth/jwt"

const intlMiddleware = createIntlMiddleware({
  locales: ["cs", "en", "uk"],
  defaultLocale: "cs",
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Спочатку обробляємо інтернаціоналізацію
  const intlResponse = intlMiddleware(request)

  // Перевіряємо режим технічних робіт
  const maintenanceMode = await isMaintenanceModeEnabled()

  if (maintenanceMode) {
    // Дозволяємо доступ до API routes
    if (pathname.startsWith("/api/")) {
      return intlResponse
    }

    // Дозволяємо доступ до auth routes (включаючи signin)
    if (pathname.includes("/auth/")) {
      return intlResponse
    }

    // Дозволяємо доступ до сторінки технічних робіт
    if (pathname.includes("/maintenance")) {
      return intlResponse
    }

    // Перевіряємо, чи користувач є адміністратором
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    const isAdmin = token?.role === "admin"

    // Дозволяємо доступ адміністраторам до admin routes
    if (isAdmin && pathname.includes("/admin")) {
      return intlResponse
    }

    // Для всіх інших випадків перенаправляємо на сторінку технічних робіт
    if (!isAdmin) {
      const locale = pathname.split("/")[1] || "cs"
      const maintenanceUrl = new URL(`/${locale}/maintenance`, request.url)
      return NextResponse.redirect(maintenanceUrl)
    }
  }

  return intlResponse
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!_next|.*\\..*|favicon.ico).*)",
    // Optional: only run on root (/) URL
    "/",
    "/(cs|en|uk)/:path*",
  ],
}
