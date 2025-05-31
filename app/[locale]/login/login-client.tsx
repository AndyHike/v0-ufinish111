"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Smartphone } from "lucide-react"
import { loginWithRedirect } from "@/app/actions/auth"

export default function LoginClient() {
  const t = useTranslations("Login")
  const { locale } = useParams() as { locale: string }
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("user")
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData(e.currentTarget)
      formData.append("role", activeTab)

      const result = await loginWithRedirect(formData, locale as string)

      if (!result.success) {
        setError(result.message || t("loginFailed"))
      }
    } catch (error) {
      console.error("Login error:", error)
      setError(t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-2 text-center mb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Tabs defaultValue="user" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="user">{t("userTab")}</TabsTrigger>
          <TabsTrigger value="admin">{t("adminTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>{t("userLoginTitle")}</CardTitle>
              <CardDescription>{t("userLoginDescription")}</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-email">{t("emailLabel")}</Label>
                  <Input id="user-email" name="email" type="email" placeholder={t("emailPlaceholder")} required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="user-password">{t("passwordLabel")}</Label>
                    <Link href={`/${locale}/forgot-password`} className="text-xs text-primary hover:underline">
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="user-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">{showPassword ? t("hidePassword") : t("showPassword")}</span>
                    </Button>
                  </div>
                </div>
                {error && <div className="text-sm text-destructive">{error}</div>}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("loggingIn") : t("login")}
                </Button>
              </CardFooter>
            </form>
          </Card>
          <div className="mt-4 text-center text-sm">
            {t("noAccount")}{" "}
            <Link href={`/${locale}/auth/signin?tab=signup`} className="text-primary hover:underline">
              {t("register")}
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>{t("adminLoginTitle")}</CardTitle>
              <CardDescription>{t("adminLoginDescription")}</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">{t("emailLabel")}</Label>
                  <Input id="admin-email" name="email" type="email" placeholder={t("emailPlaceholder")} required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-password">{t("passwordLabel")}</Label>
                    <Link href={`/${locale}/forgot-password`} className="text-xs text-primary hover:underline">
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">{showPassword ? t("hidePassword") : t("showPassword")}</span>
                    </Button>
                  </div>
                </div>
                {error && <div className="text-sm text-destructive">{error}</div>}
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("loggingIn") : t("login")}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
