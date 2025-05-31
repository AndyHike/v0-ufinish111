"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/auth/actions"
import Link from "next/link"

export default function SignInForm() {
  const t = useTranslations("Auth")
  const locale = useLocale()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await login(email, password)

      if (!result.success) {
        if (result.blocked) {
          router.push(`/${locale}/auth/signin?blocked=true`)
          return
        }

        if (result.emailNotVerified) {
          router.push(`/${locale}/auth/resend-verification?email=${encodeURIComponent(email)}`)
          return
        }

        setError(t("somethingWentWrong"))
        setIsLoading(false)
        return
      }

      router.push(`/${locale}`)
    } catch (error) {
      setError(t("unexpectedError"))
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
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
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("password")}</Label>
              <Link
                href={`/${locale}/auth/forgot-password`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              placeholder={t("passwordPlaceholder")}
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button disabled={isLoading} type="submit" className="w-full">
            {isLoading ? t("processing") : t("signIn")}
          </Button>
        </div>
      </form>
      <div className="text-center text-sm">
        <span className="text-muted-foreground">{t("noAccount")}</span>{" "}
        <Link href={`/${locale}/auth/register`} className="text-primary hover:underline">
          {t("register")}
        </Link>
      </div>
    </div>
  )
}
