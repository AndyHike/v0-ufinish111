import { getAppSetting } from "@/lib/app-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock, Wrench } from "lucide-react"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Wrench className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="flex items-center justify-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">Сайт тимчасово недоступний</span>
          </div>

          <p className="text-gray-600 leading-relaxed">{message}</p>

          {estimatedCompletion && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Очікуваний час завершення: {new Date(estimatedCompletion).toLocaleString(locale)}</span>
            </div>
          )}

          <div className="pt-4">
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href={`/${locale}/auth/login`}>Вхід для адміністраторів</Link>
            </Button>
          </div>

          <p className="text-xs text-gray-400">Дякуємо за розуміння. Ми працюємо над покращенням сервісу.</p>
        </CardContent>
      </Card>
    </div>
  )
}
