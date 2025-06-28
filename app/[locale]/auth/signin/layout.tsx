import type React from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "@/lib/get-messages"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

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

export default async function SignInLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages(locale)
  const maintenanceMode = await isMaintenanceModeEnabled()

  // Якщо режим технічних робіт увімкнено, показуємо мінімальний layout
  if (maintenanceMode) {
    return (
      <html lang={locale}>
        <body>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="fixed inset-0 w-screen h-screen z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10" />

              {/* Back button - Fixed for mobile */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50">
                <Link
                  href={`/${locale}/maintenance`}
                  className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 text-sm text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Назад до технічних робіт</span>
                  <span className="sm:hidden">Назад</span>
                </Link>
              </div>

              {/* Main content */}
              <div className="relative z-10 flex min-h-screen items-center justify-center p-4 pt-20 md:pt-4">
                <div className="w-full max-w-md">
                  <div className="mb-6 md:mb-8 text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Вхід для адміністраторів</h1>
                    <p className="text-slate-300 text-sm">Сайт знаходиться на технічному обслуговуванні</p>
                  </div>

                  {/* Form container with backdrop */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8">
                    {/* Pass maintenance mode flag to children */}
                    <div data-maintenance-mode="true">{children}</div>
                  </div>
                </div>
              </div>

              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div
                  className="absolute top-3/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
                  style={{ animationDelay: "2s" }}
                ></div>
              </div>
            </div>
          </NextIntlClientProvider>
        </body>
      </html>
    )
  }

  // Звичайний layout для нормального режиму (буде використовувати батьківський layout)
  return <>{children}</>
}
