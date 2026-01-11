"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
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
import { User, LogOut, Settings } from "lucide-react"
import { logout } from "@/app/actions/auth"

interface UserNavProps {
  user: {
    email: string
    role?: string
  } | null
}

export function UserNav({ user }: UserNavProps) {
  const t = useTranslations("UserNav")
  const params = useParams()
  const locale = params.locale as string

  // Якщо користувача немає - показуємо кнопку входу
  if (!user) {
    return (
      <Link href={`/${locale}/login`}>
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
      window.location.href = `/${locale}`
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
