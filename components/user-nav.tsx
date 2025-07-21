"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
import { createClient } from "@/lib/supabase/client"
import { signOutWithRedirect } from "@/app/actions/auth-api"

export function UserNav({ user: initialUser }: { user?: any }) {
  const t = useTranslations("UserNav")
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const [user, setUser] = useState(initialUser)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(!initialUser)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session if no user provided
    const getInitialSession = async () => {
      if (!initialUser) {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)

          // Get profile data
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          setProfile(profileData)
        }
      } else if (initialUser) {
        // Get profile data for provided user
        const getProfile = async () => {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", initialUser.id).single()
          setProfile(profileData)
        }
        getProfile()
      }

      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)

        // Get profile data
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        setProfile(profileData)
      } else {
        setUser(null)
        setProfile(null)
      }

      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [initialUser])

  const handleLogout = async () => {
    try {
      await signOutWithRedirect(locale)
    } catch (error) {
      console.error("Error signing out:", error)
      router.push(`/${locale}`)
      router.refresh()
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    )
  }

  if (!user) {
    return (
      <Link href={`/${locale}/auth/signin`}>
        <Button variant="outline" size="sm">
          {t("login")}
        </Button>
      </Link>
    )
  }

  // Create display name from profile or user data
  const displayName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || user.email
    : user.user_metadata?.full_name || user.email

  const initials =
    profile && profile.first_name && profile.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
      : displayName
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase() || user.email?.substring(0, 2).toUpperCase()

  // Check if user is admin
  const isAdmin = user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin"

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
            <p className="text-sm font-medium leading-none">{displayName || t("account")}</p>
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
        {isAdmin && (
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
