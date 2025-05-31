"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, UserIcon } from "lucide-react"
import { logout } from "@/lib/auth/actions"

export function UserNav({ user }) {
  const t = useTranslations("UserNav")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale

  if (!user) {
    return (
      <Link href={`/${locale}/auth/signin`}>
        <Button variant="outline" size="sm">
          {t("login")}
        </Button>
      </Link>
    )
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : user.email?.substring(0, 2).toUpperCase()

  const handleLogout = async () => {
    await logout()
    router.push(`/${locale}`)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || t("account")}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={`/${locale}/profile`}>
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>{t("profile")}</span>
          </DropdownMenuItem>
        </Link>
        {user.role === "admin" && (
          <Link href={`/${locale}/admin`}>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("adminPanel")}</span>
            </DropdownMenuItem>
          </Link>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
