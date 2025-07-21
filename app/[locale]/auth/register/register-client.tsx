"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Loader2, Mail, ArrowLeft, User } from "lucide-react"
import { checkUserExists, sendVerificationCode, verifyCode, createUserProfile } from "@/app/actions/auth-api"

export default function RegisterClient() {
  const t = useTranslations("Auth")
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") || ""

  const [step, setStep] = useState<"email" | "code" | "profile">("email")
  const [email, setEmail] = useState(emailParam)
  const [code, setCode] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (emailParam) {
      // If email is provided in URL, check if user exists
      checkExistingUser(emailParam)
    }
  }, [emailParam])

  const checkExistingUser = async (emailToCheck: string) => {
    const userCheck = await checkUserExists(emailToCheck)
    if (userCheck.success) {
      // User exists, redirect to login
      router.push(`/${router.locale}/auth/signin?email=${encodeURIComponent(emailToCheck)}`)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Check if user already exists
      const userCheck = await checkUserExists(email)

      if (userCheck.success) {
        // User exists, redirect to login
        router.push(`/${router.locale}/auth/signin?email=${encodeURIComponent(email)}`)
        return
      }

      // New user - send registration code
      const result = await sendVerificationCode(email, "registration")

      if (result.success) {
        setStep("code")
      } else {
        setError(result.message || t("failedToSendCode"))
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
      const result = await verifyCode(email, code, "registration")

      if (result.success) {
        setStep("profile")
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await createUserProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
        address: address || undefined,
      })

      if (result.success) {
        router.push(`/${router.locale}`)
        router.refresh()
      } else {
        setError(result.message || t("failedToCreateProfile"))
      }
    } catch (error) {
      console.error("Profile submit error:", error)
      setError(t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError("")

    try {
      const result = await sendVerificationCode(email, "registration")

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

  const handleBackToCode = () => {
    setStep("code")
    setError("")
  }

  if (step === "email") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t("signUp")}</CardTitle>
          <CardDescription className="text-center">{t("createNewAccount")}</CardDescription>
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
            <span className="text-muted-foreground">{t("alreadyHaveAccount")} </span>
            <Button variant="link" className="p-0 h-auto" asChild>
              <a href={`/${router.locale}/auth/signin`}>{t("signIn")}</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === "code") {
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
                  t("verify")
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{t("completeProfile")}</CardTitle>
        <CardDescription className="text-center">{t("fillProfileInfo")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input
                id="firstName"
                placeholder={t("enterFirstName")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input
                id="lastName"
                placeholder={t("enterLastName")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {t("phone")} ({t("optional")})
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("enterPhone")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              {t("address")} ({t("optional")})
            </Label>
            <Input
              id="address"
              placeholder={t("enterAddress")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  {t("createAccount")}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleBackToCode}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
