"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
import { signOutAndRedirect, getCurrentUser } from "@/app/actions/auth"
import { createClient } from "@/utils/supabase/client"

export function UserNav() {
  const t = useTranslations("UserNav")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Error getting user:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Слухаємо зміни auth стану
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
  }

  if (!user) {
    return (
      <Link href={`/${locale}/login`}>
        <Button variant="outline" size="sm">
          {t("login")}
        </Button>
      </Link>
    )
  }

  const initials =
    user.profile?.first_name && user.profile?.last_name
      ? `${user.profile.first_name[0]}${user.profile.last_name[0]}`
      : user.email?.substring(0, 2).toUpperCase()

  const displayName =
    user.profile?.first_name && user.profile?.last_name
      ? `${user.profile.first_name} ${user.profile.last_name}`
      : user.email

  const handleLogout = async () => {
    await signOutAndRedirect(locale)
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
            <p className="text-sm font-medium leading-none">{displayName}</p>
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
