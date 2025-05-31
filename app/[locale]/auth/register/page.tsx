import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import RegisterClient from "./register-client"
import { isRegistrationEnabled } from "@/lib/app-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function RegisterPage() {
  const t = await getTranslations("Auth")
  const registrationEnabled = await isRegistrationEnabled()

  if (!registrationEnabled) {
    return (
      <div className="container flex min-h-screen w-full flex-col items-center justify-center py-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">{t("registrationDisabled")}</CardTitle>
              <CardDescription className="text-center">{t("registrationDisabledDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 rounded-md border p-4">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div className="text-sm">{t("registrationTemporarilyDisabled")}</div>
              </div>
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="/">{t("backToLogin")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex min-h-screen w-full flex-col items-center justify-center py-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterClient />
        </Suspense>
      </div>
    </div>
  )
}
