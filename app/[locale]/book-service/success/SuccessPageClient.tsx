"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Phone, Mail, Home, MessageCircle } from "lucide-react"
import Link from "next/link"

interface Props {
  params: { locale: string }
}

export default function SuccessPageClient({ params }: Props) {
  const t = useTranslations("BookService")
  const commonT = useTranslations("Common")

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">{t("successTitle")}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 text-lg">{t("successMessage")}</p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-4">{t("whatNext")}</h3>
              <ul className="space-y-3 text-blue-800">
                <li className="flex items-start">
                  <Mail className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>{t("emailConfirmation")}</span>
                </li>
                <li className="flex items-start">
                  <Phone className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>{t("managerContact")}</span>
                </li>
                <li className="flex items-start">
                  <Calendar className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>{t("appointmentReminder")}</span>
                </li>
              </ul>
            </div>

            <div className="text-center space-y-4">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href={`/${params.locale}`}>
                  <Home className="w-4 h-4 mr-2" />
                  {commonT("backToHome")}
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href={`/${params.locale}/contact`}>
                  <MessageCircle className="w-4 h-4 mr-2" />
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
