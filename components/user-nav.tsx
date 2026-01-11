"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"
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
import { User, LogOut, Settings } from "lucide-react"
import { logout } from "@/app/actions/auth"

interface UserNavProps {
  user: {
    email: string
    role?: string
  } | null
}

export function UserNav({ user: initialUser }: UserNavProps) {
  const t = useTranslations("UserNav")
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()

  const [user, setUser] = useState(initialUser)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)

    // Check if user state changed (after login)
    const checkUserStatus = async () => {
      try {
        const response = await fetch("/api/user/current")
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching user status:", error)
      }
    }

    // Only check if we don't have a user yet
    if (!initialUser) {
      checkUserStatus()
    }
  }, [initialUser])

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  if (!isHydrated) {
    // Render the same content as server would
    if (!initialUser) {
      return (
        <Link href={`/${locale}/auth/login`}>
          <Button variant="outline" size="sm">
            <User className="mr-2 h-4 w-4" />
            {t("login")}
          </Button>
        </Link>
      )
    }

    const initials = initialUser.email.split("@")[0].substring(0, 2).toUpperCase()
    const isAdmin = initialUser.role === "admin"

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{initialUser.email}</p>
              {isAdmin && <p className="text-xs leading-none text-muted-foreground">{t("adminRole")}</p>}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/admin`}>
                <Settings className="mr-2 h-4 w-4" />
                {t("adminPanel")}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => {}}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Якщо користувача немає - показуємо кнопку входу
  if (!user) {
    return (
      <Link href={`/${locale}/auth/login`}>
        <Button variant="outline" size="sm">
          <User className="mr-2 h-4 w-4" />
          {t("login")}
        </Button>
      </Link>
    )
  }

  // Якщо користувач є - показуємо аватар з dropdown
  const initials = user.email.split("@")[0].substring(0, 2).toUpperCase()

  const isAdmin = user.role === "admin"

  const handleLogout = async () => {
    try {
      await logout()
      router.refresh()
      router.push(`/${locale}`)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/admin`}>
              <Settings className="mr-2 h-4 w-4" />
              {t("adminPanel")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
