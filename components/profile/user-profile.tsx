"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Mail, Phone, UserIcon, MapPin, Copy, Check, ShieldCheck, Percent } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface UserProfileProps {
  user: {
    id?: string
    name?: string | null
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    image?: string | null
    avatar_url?: string | null
    phone?: string | null
    address?: string | null
    role?: string
    role_name?: string | null
    role_discount_percentage?: number
    created_at?: string
  }
  locale?: string
}

export function UserProfile({ user, locale = "uk" }: UserProfileProps) {
  // Використовуємо переклади
  const t = useTranslations("Profile")
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (!user?.id) return
    navigator.clipboard.writeText(user.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Debug log to see what user data we have
  useEffect(() => {
    console.log("User profile data in component:", user)
  }, [user])

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return t("notSpecified")
    return new Date(dateString).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Get full name from first_name and last_name, fallback to name
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || t("notSpecified")

  // Get avatar URL from either avatar_url or image
  const avatarUrl =
    user?.avatar_url ||
    user?.image ||
    `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(fullName !== t("notSpecified") ? fullName : "User")}`

  // Get initials for avatar
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    } else if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return "U"
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <div className="flex flex-col items-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={fullName} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 text-center sm:text-left">
            <CardTitle className="text-2xl">{fullName}</CardTitle>
            <CardDescription className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <span className="flex items-center justify-center sm:justify-start">
                <Mail className="mr-1 h-4 w-4" />
                {user?.email || t("notSpecified")}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center justify-center sm:justify-start">
                <Phone className="mr-1 h-4 w-4" />
                {user?.phone || t("notSpecified")}
              </span>
            </CardDescription>
            {user?.id && (
              <div className="mt-2 flex items-center justify-center sm:justify-start space-x-2">
                <code className="px-2 py-0.5 rounded bg-muted text-[10px] sm:text-xs font-mono text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                  ID: {user.id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyToClipboard}
                  title={t("copy")}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("firstName")}</h3>
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div className="rounded-md border px-3 py-2 w-full bg-muted/30">
                  {user?.first_name || t("notSpecified")}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("lastName")}</h3>
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <div className="rounded-md border px-3 py-2 w-full bg-muted/30">
                  {user?.last_name || t("notSpecified")}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("email")}</h3>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="rounded-md border px-3 py-2 w-full bg-muted/30">{user?.email || t("notSpecified")}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("phone")}</h3>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div className="rounded-md border px-3 py-2 w-full bg-muted/30">{user?.phone || t("notSpecified")}</div>
              </div>
            </div>
            {user?.address && (
              <div className="space-y-2 sm:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">{t("address")}</h3>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="rounded-md border px-3 py-2 w-full bg-muted/30">{user?.address}</div>
                </div>
              </div>
            )}
            <div className="space-y-2 sm:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground">{t("registrationDate")}</h3>
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div className="rounded-md border px-3 py-2 w-full bg-muted/30">{formatDate(user?.created_at)}</div>
              </div>
            </div>

            {user?.role_name && (
              <div className="space-y-3 sm:col-span-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-primary">
                      {t("roleLevel", { level: user.role_name })}
                    </h3>
                  </div>
                  {user.role_discount_percentage && user.role_discount_percentage > 0 && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20">
                      -{user.role_discount_percentage}%
                    </Badge>
                  )}
                </div>
                {user.role_discount_percentage && user.role_discount_percentage > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    <p>{t("roleDiscountDescription")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-4 text-center">
            <p>{t("editingNotAvailable")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UserProfile
