"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

interface SignInFormProps {
  locale: string
}

export default function SignInForm({ locale }: SignInFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations("Auth")

  // Check if we're in maintenance mode
  const isMaintenanceMode =
    typeof window !== "undefined" && document.querySelector('[data-maintenance-mode="true"]') !== null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t("invalidCredentials"))
      } else {
        router.push(`/${locale}/admin`)
        router.refresh()
      }
    } catch (error) {
      setError(t("signInError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-300">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">
            {t("email")}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
            placeholder={t("enterEmail")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">
            {t("password")}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 pr-10"
              placeholder={t("enterPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-white/70 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full bg-white text-slate-900 hover:bg-white/90" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("signingIn")}
            </>
          ) : (
            t("signIn")
          )}
        </Button>
      </form>

      {/* Show registration and forgot password links only if NOT in maintenance mode */}
      {!isMaintenanceMode && (
        <div className="space-y-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <Link
              href={`/${locale}/auth/forgot-password`}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          <div className="text-center">
            <span className="text-sm text-white/70">{t("noAccount")} </span>
            <Link href={`/${locale}/auth/register`} className="text-sm text-white hover:underline transition-colors">
              {t("signUp")}
            </Link>
          </div>
        </div>
      )}

      {/* Show maintenance mode message */}
      {isMaintenanceMode && (
        <div className="pt-4 border-t border-white/20 text-center">
          <p className="text-xs text-white/60">Реєстрація тимчасово недоступна під час технічних робіт</p>
        </div>
      )}
    </div>
  )
}
