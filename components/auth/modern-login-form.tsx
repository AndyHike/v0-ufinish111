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
import { Smartphone, Mail, ArrowLeft } from "lucide-react"
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

      // Redirect to appropriate page after successful login
      router.push(`/${locale}`)
    } catch (error) {
      console.error("Verification error:", error)
      setError(t("somethingWentWrong"))
    } finally {
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
    <Card>
      <CardHeader>
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t("signInToAccount")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "initial" && (
          <>
            <Tabs defaultValue="email">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="email">
                  <Mail className="mr-2 h-4 w-4" />
                  {t("emailLogin")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="email">
                <form onSubmit={handleInitialSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t("emailPlaceholder")}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t("processing") : t("continueLogin")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">{t("noAccount")}</span>{" "}
              <Link href={`/${locale}/auth/register`} className="text-primary hover:underline">
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
              className="mb-2 -ml-2 flex items-center text-muted-foreground"
              onClick={() => setStep("initial")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("backToLogin")}
            </Button>

            <div className="text-center mb-4">
              <p>{t("verificationCodeSent")}</p>
              <p className="text-sm text-muted-foreground mt-1">{userEmail || identifier}</p>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("enterVerificationCode")}</Label>
                <Input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("processing") : t("verifyAndLogin")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
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
