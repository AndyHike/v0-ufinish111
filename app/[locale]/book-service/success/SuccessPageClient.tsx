"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home, Phone } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"

interface SuccessPageClientProps {
  locale: string
}

export default function SuccessPageClient({ locale }: SuccessPageClientProps) {
  const t = useTranslations("BookService.success")

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">{t("title")}</CardTitle>
          <CardDescription className="text-lg">{t("description")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-800">{t("message")}</p>
          </div>

          <div className="space-y-4">
            <p className="text-muted-foreground">{t("nextSteps")}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="default" size="lg">
                <Link href={`/${locale}`} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {t("backToHome")}
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg">
                <Link href={`/${locale}/contact`} className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t("contactUs")}
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>{t("emailNote")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
