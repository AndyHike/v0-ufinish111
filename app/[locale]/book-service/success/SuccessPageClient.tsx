"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home, MessageCircle } from "lucide-react"
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
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">{t("successTitle")}</CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">{t("successMessage")}</p>
              <p className="text-sm text-gray-500">{t("contactSoon")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href={`/${locale}`}>
                  <Home className="h-4 w-4 mr-2" />
                  {commonT("backToHome")}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${locale}/contact`}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {commonT("contactUs")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
