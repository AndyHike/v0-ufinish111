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

  // Check if we're in maintenance mode
  const isMaintenanceMode =
    typeof window !== "undefined" && document.querySelector('[data-maintenance-mode="true"]') !== null

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
    <Card
      className={`w-full max-w-md shadow-xl border-0 ${isMaintenanceMode ? "bg-transparent border-none shadow-none" : "bg-white"}`}
    >
      <CardHeader className="space-y-2 pb-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="text-center space-y-1">
            <CardTitle
              className={`text-xl font-bold ${isMaintenanceMode ? "text-white" : "bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"}`}
            >
              {t("signInToAccount")}
            </CardTitle>
            <p className={`text-xs max-w-sm ${isMaintenanceMode ? "text-slate-300" : "text-gray-600"}`}>
              {t("signInDescription")}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className={`text-sm font-medium ${isMaintenanceMode ? "text-white" : "text-gray-700"}`}
              >
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
                className={`h-10 rounded-lg ${isMaintenanceMode ? "bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`}
                required
              />
            </div>
            {error && (
              <div
                className={`text-sm font-medium p-3 rounded-lg border ${isMaintenanceMode ? "text-red-300 bg-red-500/10 border-red-500/20" : "text-red-600 bg-red-50 border-red-200"}`}
              >
                {error}
              </div>
            )}
            <Button
              disabled={isLoading}
              type="submit"
              className={`w-full h-10 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${isMaintenanceMode ? "bg-white text-slate-900 hover:bg-white/90" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"}`}
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
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className={`mb-4 -ml-2 flex items-center hover:text-gray-800 ${isMaintenanceMode ? "text-white/70 hover:text-white" : "text-gray-600"}`}
              onClick={() => setStep("email")}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToEmail")}
            </Button>

            <div className="text-center space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 mx-auto">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isMaintenanceMode ? "text-white" : "text-gray-900"}`}>
                  {t("verificationCodeSent")}
                </h3>
                <p className={`text-sm mt-1 ${isMaintenanceMode ? "text-slate-300" : "text-gray-600"}`}>
                  <span className="font-medium">{email}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="verification-code"
                  className={`text-sm font-medium ${isMaintenanceMode ? "text-white" : "text-gray-700"}`}
                >
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
                  className={`h-10 text-center text-lg tracking-widest rounded-lg ${isMaintenanceMode ? "bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`}
                  required
                />
                <Button
                  type="button"
                  variant="link"
                  className={`px-0 text-sm font-normal hover:text-blue-700 ${isMaintenanceMode ? "text-white/70 hover:text-white" : "text-blue-600"}`}
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
                <div
                  className={`text-sm font-medium p-3 rounded-lg border ${isMaintenanceMode ? "text-red-300 bg-red-500/10 border-red-500/20" : "text-red-600 bg-red-50 border-red-200"}`}
                >
                  {error}
                </div>
              )}
              <Button
                disabled={isLoading}
                type="submit"
                className={`w-full h-10 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${isMaintenanceMode ? "bg-white text-slate-900 hover:bg-white/90" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"}`}
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

        {/* Show registration link only if NOT in maintenance mode */}
        {!isMaintenanceMode && (
          <div className="text-center text-sm space-y-2">
            <p className="text-gray-600">{t("noAccount")}</p>
            <Link
              href={`/${locale}/auth/register`}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              {t("register")}
            </Link>
          </div>
        )}

        {/* Show maintenance mode message instead of registration */}
        {isMaintenanceMode && (
          <div className="text-center text-sm pt-4 border-t border-white/20">
            <p className="text-white/60">Реєстрація тимчасово недоступна під час технічних робіт</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
