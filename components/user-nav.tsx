"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building2, User, LogOut, Settings } from "lucide-react"
import { useEffect, useState } from "react"

interface UserNavProps {
  user: {
    email: string
    role?: string
  } | null
  variant?: "default" | "b2b"
  businessRegisterHref?: string
  businessRegisterLabel?: string
}

export function UserNav({
  user,
  variant = "default",
  businessRegisterHref,
  businessRegisterLabel,
}: UserNavProps) {
  const t = useTranslations("UserNav")
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isB2BVariant = variant === "b2b"

  useEffect(() => {
    const channel = new BroadcastChannel("auth_channel")

    channel.onmessage = (event) => {
      if (event.data === "logout") {
        window.location.href = `/${locale}`
      }
    }

    return () => {
      channel.close()
    }
  }, [locale])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Logout request failed")
      }

      const channel = new BroadcastChannel("auth_channel")
      channel.postMessage("logout")
      channel.close()
      window.location.href = `/${locale}`
    } catch (error) {
      console.error("Logout error:", error)
      setIsLoggingOut(false)
    }
  }

  if (!user || isLoggingOut) {
    const guestHref = isB2BVariant ? businessRegisterHref ?? `/${locale}/auth/register?b2b=1` : `/${locale}/auth/login`
    const guestLabel = isB2BVariant ? businessRegisterLabel ?? t("login") : t("login")
    const GuestIcon = isB2BVariant ? Building2 : User

    return (
      <Button asChild variant={isB2BVariant ? "default" : "outline"} size="sm" className="whitespace-nowrap">
        <Link href={guestHref} suppressHydrationWarning>
          <GuestIcon className="mr-2 h-4 w-4" />
          {guestLabel}
        </Link>
      </Button>
    )
  }

  const initials = user.email.split("@")[0].substring(0, 2).toUpperCase()
  const isAdmin = user.role === "admin"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild suppressHydrationWarning>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            {isAdmin && <p className="text-xs leading-none text-muted-foreground">{t("adminRole")}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/profile`}>
            <User className="mr-2 h-4 w-4" />
            {t("profile")}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/admin`}>
              <Settings className="mr-2 h-4 w-4" />
              {t("adminPanel")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
