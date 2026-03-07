"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
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
  const t = useTranslations("Profile")
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (!user?.id) return
    navigator.clipboard.writeText(user.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    console.log("User profile data in component:", user)
  }, [user])

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("notSpecified")
    return new Date(dateString).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || t("notSpecified")

  const avatarUrl =
    user?.avatar_url ||
    user?.image ||
    `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(fullName !== t("notSpecified") ? fullName : "User")}`

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
    <Card className="w-full shadow-sm overflow-hidden">
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-end sm:space-x-5">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white/30 shadow-lg">
            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={fullName} />
            <AvatarFallback className="text-xl sm:text-2xl bg-white/20 text-white font-bold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="mt-3 sm:mt-0 sm:pb-1 flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{fullName}</h2>
            {user?.role_name && (
              <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {user.role_name}
                </Badge>
                {user.role_discount_percentage && user.role_discount_percentage > 0 && (
                  <Badge className="bg-green-500/80 text-white border-green-400/30 hover:bg-green-500/90 text-xs">
                    <Percent className="mr-1 h-3 w-3" />
                    -{user.role_discount_percentage}%
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Account ID chip - positioned in header */}
        {user?.id && (
          <div className="mt-3 flex items-center justify-center sm:justify-start">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white/80 hover:text-white text-[11px] sm:text-xs font-mono cursor-pointer border border-white/10"
              title={t("copy")}
            >
              <span className="truncate max-w-[180px] sm:max-w-[280px]">ID: {user.id}</span>
              {copied ? (
                <Check className="h-3 w-3 text-green-300 flex-shrink-0" />
              ) : (
                <Copy className="h-3 w-3 flex-shrink-0" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-5">
          {/* Contact info - stacked on mobile, grid on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <ProfileField
              icon={<UserIcon className="h-4 w-4" />}
              label={t("firstName")}
              value={user?.first_name || t("notSpecified")}
            />
            <ProfileField
              icon={<UserIcon className="h-4 w-4" />}
              label={t("lastName")}
              value={user?.last_name || t("notSpecified")}
            />
            <ProfileField
              icon={<Mail className="h-4 w-4" />}
              label={t("email")}
              value={user?.email || t("notSpecified")}
              breakAll
            />
            <ProfileField
              icon={<Phone className="h-4 w-4" />}
              label={t("phone")}
              value={user?.phone || t("notSpecified")}
            />
            {user?.address && (
              <div className="sm:col-span-2">
                <ProfileField
                  icon={<MapPin className="h-4 w-4" />}
                  label={t("address")}
                  value={user.address}
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <ProfileField
                icon={<CalendarDays className="h-4 w-4" />}
                label={t("registrationDate")}
                value={formatDate(user?.created_at)}
              />
            </div>
          </div>

          {/* Role discount info card */}
          {user?.role_name && user.role_discount_percentage && user.role_discount_percentage > 0 && (
            <div className="rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/15 p-3.5 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Percent className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    {t("roleLevel", { level: user.role_name })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("roleDiscountDescription")}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20 flex-shrink-0 text-sm font-bold">
                  -{user.role_discount_percentage}%
                </Badge>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <p>{t("editingNotAvailable")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Compact profile field component for consistent layout */
function ProfileField({
  icon,
  label,
  value,
  breakAll = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  breakAll?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2.5 sm:py-2">
        <span className="text-muted-foreground flex-shrink-0">{icon}</span>
        <span className={`text-sm text-foreground truncate ${breakAll ? "break-all" : ""}`}>{value}</span>
      </div>
    </div>
  )
}

export default UserProfile
