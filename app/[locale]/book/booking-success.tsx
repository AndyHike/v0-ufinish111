"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Phone, Mail, Clock } from "lucide-react"

interface BookingSuccessProps {
  locale: string
}

export default function BookingSuccess({ locale }: BookingSuccessProps) {
  const t = useTranslations("StandaloneBooking")

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6 sm:py-8">
      <div className="max-w-sm w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 rounded-full p-3">
            <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={1.5} />
          </div>
        </div>

        {/* Main Message */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t("successTitle")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {t("successMessage")}
          </p>
        </div>

        {/* Next Steps - Compact */}
        <div className="bg-gray-50 rounded-lg p-4 sm:p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            {t("nextSteps")}
          </h2>

          <div className="space-y-2">
            {/* Step 1 */}
            <div className="flex gap-3 text-sm">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs">
                1
              </span>
              <p className="text-gray-700 pt-0.5">{t("step1")}</p>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 text-sm">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs">
                2
              </span>
              <p className="text-gray-700 pt-0.5">{t("step2")}</p>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 text-sm">
              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs">
                3
              </span>
              <p className="text-gray-700 pt-0.5">{t("step3")}</p>
            </div>
          </div>
        </div>

        {/* Contact Information - Compact */}
        <div className="bg-blue-50 rounded-lg p-4 sm:p-5 mb-5 space-y-3">
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{t("phoneLabel")}</p>
              <p className="text-sm text-gray-900">{t("phoneValue")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{t("emailLabel")}</p>
              <p className="text-sm text-gray-900">{t("emailValue")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{t("workingHours")}</p>
              <p className="text-sm text-gray-900">{t("workingHoursValue")}</p>
            </div>
          </div>
        </div>

        {/* Action Button - Single CTA */}
        <Button
          asChild
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-semibold rounded-lg transition-colors"
        >
          <Link href={`/${locale}`}>
            {t("backToHome")}
          </Link>
        </Button>
      </div>
    </div>
  )
}

