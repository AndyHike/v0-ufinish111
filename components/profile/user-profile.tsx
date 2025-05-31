"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Mail, Phone, UserIcon, MapPin } from "lucide-react"

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
    created_at?: string
  }
  locale?: string
}

export function UserProfile({ user, locale = "uk" }: UserProfileProps) {
  // Використовуємо переклади
  const t = useTranslations("Profile")

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
