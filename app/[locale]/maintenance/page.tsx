import { getAppSetting } from "@/lib/app-settings"
import { AlertTriangle, Clock, Wrench, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MaintenancePage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const title = (await getAppSetting("maintenance_mode_title")) || "Технічні роботи"
  const message =
    (await getAppSetting("maintenance_mode_message")) ||
    "Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше."
  const estimatedCompletion = await getAppSetting("maintenance_mode_estimated_completion")

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Admin Login Button - Fixed Position */}
      <div className="fixed top-6 right-6 z-10">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
        >
          <Link href={`/${locale}/auth/login`} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Вхід для адміністраторів
          </Link>
        </Button>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-2xl mx-auto">
          {/* Icon */}
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-orange-500/20 backdrop-blur-sm">
            <Wrench className="h-12 w-12 text-orange-400" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">{title}</h1>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 text-orange-300 mb-8">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Сайт тимчасово недоступний</span>
          </div>

          {/* Message */}
          <p className="text-xl text-gray-300 leading-relaxed mb-8 max-w-lg mx-auto">{message}</p>

          {/* Estimated Completion */}
          {estimatedCompletion && (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-gray-300 mb-8">
              <Clock className="h-5 w-5 text-blue-400" />
              <span>
                Очікуваний час завершення:{" "}
                {new Date(estimatedCompletion).toLocaleString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {/* Footer Message */}
          <p className="text-gray-400 text-lg">Дякуємо за розуміння. Ми працюємо над покращенням сервісу.</p>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>
    </div>
  )
}
