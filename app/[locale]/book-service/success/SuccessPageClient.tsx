"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowLeft, Calendar, Phone } from "lucide-react"
import Link from "next/link"

interface Props {
  locale: string
}

export default function SuccessPageClient({ locale }: Props) {
  const t = useTranslations("BookService")
  const commonT = useTranslations("Common")

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href={`/${locale}`}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {commonT("backToHome")}
          </Link>
        </nav>

        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">{t("successTitle")}</CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">{t("successMessage")}</p>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-medium text-gray-900">{t("nextSteps")}</h3>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-medium text-xs">1</span>
                    </div>
                    <p className="text-left">{t("step1")}</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-medium text-xs">2</span>
                    </div>
                    <p className="text-left">{t("step2")}</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-medium text-xs">3</span>
                    </div>
                    <p className="text-left">{t("step3")}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-600 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{t("workingHours")}: 9:00 - 19:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+420 775 848 259</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button asChild className="flex-1 bg-gray-900 hover:bg-gray-800">
                <Link href={`/${locale}`}>{commonT("backToHome")}</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 bg-transparent">
                <Link href={`/${locale}/brands`}>Переглянути всі послуги</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
