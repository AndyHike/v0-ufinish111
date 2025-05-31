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
        <form onSubmit={handleEmailSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                placeholder={t("emailPlaceholder")}
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button disabled={isLoading} type="submit" className="w-full">
              {isLoading ? t("processing") : t("continue")}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerificationSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="verification-code">{t("verificationCode")}</Label>
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
                required
              />
              <p className="text-sm text-muted-foreground">
                {t("verificationCodeSent")} {email}
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
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button disabled={isLoading} type="submit" className="w-full">
              {isLoading ? t("processing") : t("signIn")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("email")}
              disabled={isLoading}
              className="w-full"
            >
              {t("backToEmail")}
            </Button>
          </div>
        </form>
      )}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t("noAccount")}</span>{" "}
        <Link href={`/${locale}/auth/register`} className="text-primary hover:underline">
          {t("register")}
        </Link>
      </div>
    </div>
  )
}
