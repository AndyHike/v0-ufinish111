import Link from "next/link"
import { AlertTriangle, LogIn } from "lucide-react"
import { getMaintenanceSettings } from "@/lib/maintenance-mode"

export const metadata = {
  title: "Технічні роботи",
}

/**
 * Full-screen maintenance overlay.
 * Shows the message configured in the admin panel and nothing else.
 */
export default async function MaintenancePage() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const settings = await getMaintenanceSettings()

  const {
    title = "Технічні роботи",
    message = "Наразі проводяться технічні роботи. Будь ласка, спробуйте пізніше.",
    estimated_completion: eta = "",
  } = settings ?? {}

  return (
    <main className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 to-white p-6 text-center">
      <AlertTriangle className="mb-6 h-16 w-16 text-orange-500" />
      <h1 className="mb-4 text-3xl font-bold">{title}</h1>
      <p className="max-w-xl text-lg leading-relaxed text-gray-700">{message}</p>

      {eta && (
        <p className="mt-4 rounded-md bg-orange-50 px-3 py-1.5 text-sm text-orange-700">
          Очікуваний час завершення:&nbsp;
          {new Date(eta).toLocaleString("uk-UA")}
        </p>
      )}

      <Link
        href="/auth/signin"
        className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-300"
      >
        <LogIn className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
        Вхід для адміністраторів
      </Link>
    </main>
  )
}
