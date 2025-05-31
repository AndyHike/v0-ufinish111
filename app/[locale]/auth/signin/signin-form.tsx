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
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"

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
    <div className="grid gap-6">
      {step === "email" ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-medium">
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
              className="border border-input rounded-md px-3 py-2"
              required
            />
          </div>
          {error && (
            <div className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded-md">{error}</div>
          )}
          <Button disabled={isLoading} type="submit" className="w-full font-medium">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("processing")}
              </>
            ) : (
              t("continue")
            )}
          </Button>
        </form>
      ) : (
        <Card className="border border-border p-4">
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="verification-code" className="text-sm font-medium">
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
                className="border border-input rounded-md px-3 py-2 text-center text-lg tracking-widest"
                required
              />
              <p className="text-sm text-muted-foreground">
                {t("verificationCodeSent")} <span className="font-medium">{email}</span>
              </p>
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm font-normal"
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
              <div className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded-md">{error}</div>
            )}
            <Button disabled={isLoading} type="submit" className="w-full font-medium">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("signIn")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("email")}
              disabled={isLoading}
              className="w-full font-medium"
            >
              {t("backToEmail")}
            </Button>
          </form>
        </Card>
      )}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t("noAccount")}</span>{" "}
        <Link href={`/${locale}/auth/register`} className="text-primary hover:underline font-medium">
          {t("register")}
        </Link>
      </div>
    </div>
  )
}
