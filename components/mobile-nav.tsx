"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogOut, Settings, Phone, Home, Smartphone, Mail, UserPlus, LogIn } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"

interface MobileNavProps {
  user: { id: string; email: string; name: string; role: string } | null
  onLogout: () => void
}

export function MobileNav({ user, onLogout }: MobileNavProps) {
  const t = useTranslations("header")
  const params = useParams()
  const locale = params.locale as string

  return (
    <div className="flex flex-col space-y-4 py-4">
      {/* Navigation Links */}
      <div className="space-y-2">
        <Link href={`/${locale}`} className="flex items-center space-x-2 text-lg font-medium">
          <Home className="h-5 w-5" />
          <span>{t("home")}</span>
        </Link>
        <Link href={`/${locale}/brands`} className="flex items-center space-x-2 text-lg font-medium">
          <Smartphone className="h-5 w-5" />
          <span>{t("brands")}</span>
        </Link>
        <Link href={`/${locale}/contact`} className="flex items-center space-x-2 text-lg font-medium">
          <Mail className="h-5 w-5" />
          <span>{t("contact")}</span>
        </Link>
      </div>

      <Separator />

      {/* User Section */}
      {user ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 px-2 py-1">
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">{user.name || user.email}</span>
          </div>

          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href={`/${locale}/profile`}>
              <Settings className="h-4 w-4 mr-2" />
              {t("profile")}
            </Link>
          </Button>

          {user.role === "admin" && (
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href={`/${locale}/admin`}>
                <Settings className="h-4 w-4 mr-2" />
                {t("admin")}
              </Link>
            </Button>
          )}

          <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            {t("signOut")}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href={`/${locale}/auth/signin`}>
              <LogIn className="h-4 w-4 mr-2" />
              {t("signIn")}
            </Link>
          </Button>
          <Button className="w-full justify-start" asChild>
            <Link href={`/${locale}/auth/register`}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t("signUp")}
            </Link>
          </Button>
        </div>
      )}

      <Separator />

      {/* Contact Info */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4" />
          <span>+420 123 456 789</span>
        </div>
      </div>
    </div>
  )
}
