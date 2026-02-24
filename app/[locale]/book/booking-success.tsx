"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Phone, Mail, Clock } from "lucide-react"

interface BookingSuccessProps {
  locale: string
  phone?: string
}

export default function BookingSuccess({ locale, phone }: BookingSuccessProps) {
  const t = useTranslations("StandaloneBooking")

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" strokeWidth={1.5} />
          </div>
        </div>

        {/* Main Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {t("successTitle")}
          </h1>
          <p className="text-lg text-gray-600">
            {t("successMessage")}
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            {t("nextSteps")}
          </h2>

          <div className="space-y-5">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                  1
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">{t("step1")}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                  2
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">{t("step2")}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                  3
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">{t("step3")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 sm:p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Наші контакти
          </h3>

          <div className="space-y-4">
            {phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Телефон</p>
                  <p className="font-medium text-gray-900">{phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">contact@repair.cz</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">{t("workingHours")}</p>
                <p className="font-medium text-gray-900">Пн-Пт: 9:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold rounded-lg transition-colors"
          >
            <Link href={`/${locale}`}>
              {t("backToHome")}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex-1 py-6 text-base font-semibold rounded-lg"
          >
            <Link href={`/${locale}/services`}>
              Інші послуги
            </Link>
          </Button>
        </div>

        {/* Additional Info */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Якщо у вас виникли питання, зв'яжіться з нами зразу
        </p>
      </div>
    </div>
  )
}
