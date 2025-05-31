"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResetPasswordClientProps {
  token: string
  locale: string
  showError: boolean
  showMismatchError: boolean
  resetPasswordAction: (formData: FormData) => Promise<{ redirect: string }>
}

export function ResetPasswordClient({
  token,
  locale,
  showError,
  showMismatchError,
  resetPasswordAction,
}: ResetPasswordClientProps) {
  const t = useTranslations("Auth")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      await resetPasswordAction(formData)
    } catch (error) {
      console.error("Error resetting password:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-center">{t("missingToken")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTitle>{t("passwordResetError")}</AlertTitle>
                <AlertDescription>{t("missingTokenDescription")}</AlertDescription>
              </Alert>
              <div className="mt-4 text-center">
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("resetPassword")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-12">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">{t("resetPassword")}</CardTitle>
            <p className="text-sm text-muted-foreground text-center">{t("enterNewPassword")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {showError && (
              <Alert variant="destructive">
                <AlertTitle>{t("passwordResetError")}</AlertTitle>
                <AlertDescription>{t("passwordResetErrorDescription")}</AlertDescription>
              </Alert>
            )}

            {showMismatchError && (
              <Alert variant="destructive">
                <AlertTitle>{t("passwordResetError")}</AlertTitle>
                <AlertDescription>{t("passwordsDoNotMatch")}</AlertDescription>
              </Alert>
            )}

            <form action={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("newPassword")}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder={t("newPasswordPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder={t("confirmPasswordPlaceholder")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("processing") : t("resetPassword")}
                </Button>
              </div>
            </form>

            <div className="text-center">
              <Link href={`/${locale}/auth/signin`} className="text-sm text-muted-foreground hover:text-foreground">
                {t("backToSignIn")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
