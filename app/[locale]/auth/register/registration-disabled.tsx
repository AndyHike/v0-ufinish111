"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserX, AlertTriangle, Home } from "lucide-react"

export default function RegistrationDisabled() {
  const t = useTranslations("Auth")
  const params = useParams()
  const locale = params.locale as string

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <UserX className="h-6 w-6 text-white" />
            </div>
            <div className="text-center space-y-1">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {t("registrationDisabled")}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {t("registrationDisabledDescription")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">{t("registrationTemporarilyDisabled")}</AlertDescription>
          </Alert>

          <Button
            asChild
            className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Link href={`/${locale}`}>
              <Home className="mr-2 h-4 w-4" />
              {t("backToHome")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
