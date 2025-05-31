"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { sendVerificationCode, verifyLoginCode } from "@/lib/auth/actions"
import { Loader2, Shield, CheckCircle, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignInForm() {
  const t = useTranslations("Auth")
  const locale = useLocale()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"email" | "verification">("email")
  const [verificationCode, setVerificationCode] = useState("")

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const emailValue = formData.get("email") as string
    setEmail(emailValue)

    try {
      const result = await sendVerificationCode(emailValue, true) // true indicates this is for login

      if (!result.success) {
        setError(result.message || t("somethingWentWrong"))
        setIsLoading(false)
        return
      }

      setStep("verification")
      setIsLoading(false)
    } catch (error) {
      setError(t("unexpectedError"))
      setIsLoading(false)
    }
  }

  async function handleVerificationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await verifyLoginCode(email, verificationCode)

      if (!result.success) {
        setError(result.message || t("invalidVerificationCode"))
        setIsLoading(false)
        return
      }

      // Redirect based on user role
      if (result.role === "admin") {
        router.push(`/${locale}/admin`)
      } else {
        router.push(`/${locale}/profile`)
      }
    } catch (error) {
      setError(t("unexpectedError"))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 pb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {t("signInToAccount")}
              </CardTitle>
              <p className="text-sm text-gray-600 max-w-sm">{t("signInDescription")}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t("email")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  placeholder={t("emailPlaceholder")}
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  required
                />
              </div>
              {error && (
                <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              <Button
                disabled={isLoading}
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>{t("processing")}</span>
                  </div>
                ) : (
                  t("continue")
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 -ml-2 flex items-center text-gray-600 hover:text-gray-800"
                onClick={() => setStep("email")}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToEmail")}
              </Button>

              <div className="text-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t("verificationCodeSent")}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">{email}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerificationSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="verification-code" className="text-sm font-medium text-gray-700">
                    {t("verificationCode")}
                  </Label>
                  <Input
                    id="verification-code"
                    name="verification-code"
                    placeholder={t("verificationCodePlaceholder") || "Enter 6-digit code"}
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    autoCapitalize="none"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    disabled={isLoading}
                    className="h-12 text-center text-lg tracking-widest border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    required
                  />
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm font-normal text-blue-600 hover:text-blue-700"
                    onClick={async () => {
                      setIsLoading(true)
                      try {
                        await sendVerificationCode(email, true)
                        setIsLoading(false)
                      } catch (error) {
                        setError(t("unexpectedError"))
                        setIsLoading(false)
                      }
                    }}
                    disabled={isLoading}
                  >
                    {t("resendCode")}
                  </Button>
                </div>
                {error && (
                  <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}
                <Button
                  disabled={isLoading}
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>{t("processing")}</span>
                    </div>
                  ) : (
                    t("signIn")
                  )}
                </Button>
              </form>
            </div>
          )}
          <div className="text-center text-sm space-y-2">
            <p className="text-gray-600">{t("noAccount")}</p>
            <Link
              href={`/${locale}/auth/register`}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              {t("register")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
