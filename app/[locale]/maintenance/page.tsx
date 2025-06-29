import { redirect } from "next/navigation"
import { isMaintenanceModeEnabled } from "@/lib/maintenance-mode"
import { getLocale } from "@/lib/get-locale"

export default async function MaintenancePage() {
  // Перевіряємо чи ще активний режим технічного обслуговування
  const maintenanceEnabled = await isMaintenanceModeEnabled()

  if (!maintenanceEnabled) {
    // Якщо технічне обслуговування завершено, перенаправляємо на домашню сторінку
    const locale = await getLocale()
    redirect(`/${locale}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Технічне обслуговування</h1>
          <p className="text-gray-600">
            Наш сайт тимчасово недоступний через технічні роботи. Ми працюємо над покращенням сервісу.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Очікуйте на відновлення роботи...</span>
          </div>

          <p className="text-xs text-gray-400">Дякуємо за розуміння!</p>
        </div>
      </div>
    </div>
  )
}
