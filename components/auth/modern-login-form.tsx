"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import { checkUserExists, sendVerificationCode, verifyCode } from "@/app/actions/auth-api"

interface ModernLoginFormProps {
  locale: string
}

export default function ModernLoginForm({ locale }: ModernLoginFormProps) {
  const t = useTranslations("Auth")
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || `/${locale}`

  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isNewUser, setIsNewUser] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Check if user exists
      const userCheck = await checkUserExists(email)

      if (userCheck.success) {
        // Existing user - send login code
        setIsNewUser(false)
        const result = await sendVerificationCode(email, "login")

        if (result.success) {
          setStep("code")
        } else {
          setError(result.message || t("failedToSendCode"))
        }
      } else {
        // New user - redirect to registration
        router.push(`/${locale}/auth/register?email=${encodeURIComponent(email)}`)
      }
    } catch (error) {
      console.error("Email submit error:", error)
      setError(t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return

    setIsLoading(true)
    setError("")

    try {
      const result = await verifyCode(email, code, "login")

      if (result.success) {
        router.push(redirectTo)
        router.refresh()
      } else {
        setError(result.message || t("invalidCode"))
        setCode("")
      }
    } catch (error) {
      console.error("Code submit error:", error)
      setError(t("somethingWentWrong"))
      setCode("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError("")

    try {
      const result = await sendVerificationCode(email, "login")

      if (!result.success) {
        setError(result.message || t("failedToSendCode"))
      }
    } catch (error) {
      console.error("Resend code error:", error)
      setError(t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep("email")
    setCode("")
    setError("")
  }

  if (step === "email") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t("signIn")}</CardTitle>
          <CardDescription className="text-center">{t("enterEmailToSignIn")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("enterEmail")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("checking")}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t("continue")}
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">{t("dontHaveAccount")} </span>
            <Button variant="link" className="p-0 h-auto" asChild>
              <a href={`/${locale}/auth/register`}>{t("signUp")}</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{t("enterCode")}</CardTitle>
        <CardDescription className="text-center">
          {t("codeSentTo")} <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">{t("verificationCode")}</Label>
            <div className="flex justify-center">
              <InputOTP
                value={code}
                onChange={setCode}
                maxLength={6}
                disabled={isLoading}
                onComplete={() => {
                  // Auto-submit when code is complete
                  if (code.length === 6) {
                    handleCodeSubmit(new Event("submit") as any)
                  }
                }}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("verifying")}
                </>
              ) : (
                t("signIn")
              )}
            </Button>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={handleBackToEmail}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("back")}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={handleResendCode}
                disabled={isLoading}
              >
                {t("resendCode")}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
