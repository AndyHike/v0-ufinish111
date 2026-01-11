"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft, Shield, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { checkUserExists, sendVerificationCode, verifyCode } from "@/app/actions/auth-api"

interface ModernLoginFormProps {
  locale: string
}

export function ModernLoginForm({ locale }: ModernLoginFormProps) {
  const t = useTranslations("Auth")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [error, setError] = useState("")
  const [step, setStep] = useState<"initial" | "verification">("initial")
  const [verificationCode, setVerificationCode] = useState("")
  const [userEmail, setUserEmail] = useState("")

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log(`Submitting login with email: ${identifier}`)

      // Check if user exists in Remonline API
      const userExists = await checkUserExists(identifier)

      if (!userExists.success) {
        setError(userExists.message || t("userNotFound"))
        setIsLoading(false)
        return
      }

      console.log("User exists:", userExists)

      // Send verification code
      const result = await sendVerificationCode(identifier, "login")

      if (!result.success) {
        setError(result.message || t("somethingWentWrong"))
        setIsLoading(false)
        return
      }

      // If the verification code was sent to a different email (in case of phone login)
      if (result.email) {
        setUserEmail(result.email)
      }

      // Move to verification step
      setStep("verification")
    } catch (error) {
      console.error("Login error:", error)
      setError(t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const currentIdentifier = identifier

      // Verify the code
      const result = await verifyCode(currentIdentifier, verificationCode, "login")

      if (!result.success) {
        setError(result.message || t("invalidVerificationCode"))
        setIsLoading(false)
        return
      }

      window.location.href = `/${locale}`
    } catch (error) {
      console.error("Verification error:", error)
      setError(t("somethingWentWrong"))
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError("")

    try {
      const currentIdentifier = identifier
      const result = await sendVerificationCode(currentIdentifier, "login")

      if (!result.success) {
        setError(result.message || t("somethingWentWrong"))
      }
    } catch (error) {
      console.error("Resend code error:", error)
      setError(t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0 bg-white">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {t("signInToAccount")}
            </CardTitle>
            <p className="text-xs text-gray-600 max-w-sm">{t("signInDescription")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {step === "initial" && (
          <>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-1 bg-gray-100">
                <TabsTrigger value="email" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Mail className="mr-2 h-4 w-4" />
                  {t("emailLogin")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="email" className="mt-6">
                <form onSubmit={handleInitialSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      {t("email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t("emailPlaceholder")}
                      className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t("processing")}</span>
                      </div>
                    ) : (
                      t("continue")
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            <div className="text-center text-sm space-y-2">
              <p className="text-gray-600">{t("noAccount")}</p>
              <Link
                href={`/${locale}/auth/register`}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
              >
                {t("register")}
              </Link>
            </div>
          </>
        )}

        {step === "verification" && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 flex items-center text-gray-600 hover:text-gray-800"
              onClick={() => setStep("initial")}
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
                <h3 className="text-lg font-semibold text-gray-900">{t("verificationCodeSent")}</h3>
                <p className="text-sm text-gray-600 mt-1">{userEmail || identifier}</p>
              </div>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                  {t("verificationCode")}
                </Label>
                <Input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder={t("verificationCodePlaceholder")}
                  maxLength={6}
                  className="h-10 text-center text-lg tracking-widest border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t("processing")}</span>
                  </div>
                ) : (
                  t("verifyAndLogin")
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg bg-transparent"
                onClick={handleResendCode}
                disabled={isLoading}
              >
                {t("resendCode")}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
