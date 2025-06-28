import type React from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "@/lib/get-messages"
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode"

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
      <NextIntlClientProvider locale={locale} messages={messages}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10" />
          <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Вхід для адміністраторів</h1>
                <p className="text-slate-300 text-sm">Сайт знаходиться на технічному обслуговуванні</p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </NextIntlClientProvider>
    )
  }

  // Звичайний layout для нормального режиму (буде використовувати батьківський layout)
  return <>{children}</>
}
