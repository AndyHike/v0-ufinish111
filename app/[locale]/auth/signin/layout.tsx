import type React from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "@/lib/get-messages"
import { getAppSetting } from "@/lib/app-settings"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

async function isMaintenanceModeEnabled(): Promise<boolean> {
  try {
    const enabled = await getAppSetting("maintenance_mode_enabled")
    return enabled === "true"
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
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10" />

              {/* Back button */}
              <div className="absolute top-6 left-6 z-10">
                <Link
                  href={`/${locale}/maintenance`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад до технічних робіт
                </Link>
              </div>

              {/* Main content */}
              <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-md">
                  <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Вхід для адміністраторів</h1>
                    <p className="text-slate-300 text-sm">Сайт знаходиться на технічному обслуговуванні</p>
                  </div>

                  {/* Form container with backdrop */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">{children}</div>
                </div>
              </div>

              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div
                  className="absolute top-3/4 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
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
