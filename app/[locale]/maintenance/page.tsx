import { getAppSetting } from "@/lib/app-settings"
import { AlertTriangle, Clock, Wrench, Settings } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function MaintenancePage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  // Check if maintenance mode is still enabled
  const maintenanceEnabled = await getAppSetting("maintenance_mode_enabled")

  // If maintenance mode is disabled, redirect to home page
  if (maintenanceEnabled !== "true") {
    redirect(`/${locale}`)
  }

  const title = (await getAppSetting("maintenance_mode_title")) || "Технічні роботи"
  const message =
    (await getAppSetting("maintenance_mode_message")) ||
    "Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше."
  const estimatedCompletion = await getAppSetting("maintenance_mode_estimated_completion")

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden z-[9999]">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10" />

      {/* Admin Login Button - Fixed Position */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <Link
          href={`/${locale}/auth/signin`}
          className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 rounded-lg cursor-pointer text-sm md:text-base"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Вхід для адміністраторів</span>
          <span className="sm:hidden">Вхід</span>
        </Link>
      </div>

      {/* Main Content - Centered */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
        <div className="text-center max-w-3xl mx-auto z-10">
          {/* Icon */}
          <div className="mx-auto mb-6 md:mb-8 flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-full bg-orange-500/20 backdrop-blur-sm border border-orange-500/30">
            <Wrench className="h-12 w-12 md:h-16 md:w-16 text-orange-400 animate-pulse" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-white mb-6 md:mb-8 tracking-tight leading-tight">
            {title}
          </h1>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 rounded-full bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 text-orange-300 mb-8 md:mb-10">
            <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 animate-bounce" />
            <span className="font-medium text-sm md:text-lg">Сайт тимчасово недоступний</span>
          </div>

          {/* Message */}
          <p className="text-lg md:text-2xl text-gray-300 leading-relaxed mb-8 md:mb-12 max-w-2xl mx-auto font-light px-4">
            {message}
          </p>

          {/* Estimated Completion */}
          {estimatedCompletion && (
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 py-3 md:px-8 md:py-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 mb-8 md:mb-12">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
              <div className="text-left">
                <div className="text-xs md:text-sm text-gray-400 mb-1">Очікуваний час завершення:</div>
                <div className="text-sm md:text-lg font-medium">
                  {new Date(estimatedCompletion).toLocaleString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer Message */}
          <p className="text-gray-400 text-base md:text-xl font-light px-4">
            Дякуємо за розуміння. Ми працюємо над покращенням сервісу.
          </p>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute top-3/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Geometric shapes */}
        <div
          className="absolute top-10 left-10 w-3 h-3 md:w-4 md:h-4 bg-white/20 rotate-45 animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute top-20 right-20 w-4 h-4 md:w-6 md:h-6 bg-white/10 rotate-45 animate-spin"
          style={{ animationDuration: "15s", animationDirection: "reverse" }}
        ></div>
        <div
          className="absolute bottom-20 left-20 w-2 h-2 md:w-3 md:h-3 bg-white/30 rotate-45 animate-spin"
          style={{ animationDuration: "25s" }}
        ></div>
        <div
          className="absolute bottom-10 right-10 w-3 h-3 md:w-5 md:h-5 bg-white/15 rotate-45 animate-spin"
          style={{ animationDuration: "18s", animationDirection: "reverse" }}
        ></div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
    </div>
  )
}
