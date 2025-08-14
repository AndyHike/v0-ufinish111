"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Search, UserIcon } from "lucide-react"
import { SearchDialog } from "@/components/search-dialog"
import { LanguageSwitcher } from "@/components/language-switcher"
import { SiteLogo } from "@/components/site-logo"
import { MobileNav } from "@/components/mobile-nav"
import { UserNav } from "@/components/user-nav"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"

interface HeaderUser {
  id: string
  email: string
  name: string
  role: string
}

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [user, setUser] = useState<HeaderUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const t = useTranslations("header")
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        setUser(null)
        window.location.href = `/${locale}`
      }
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const isActive = (path: string) => {
    if (path === `/${locale}`) {
      return pathname === `/${locale}` || pathname === `/${locale}/`
    }
    return pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <SiteLogo />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href={`/${locale}`}
            className={`transition-colors hover:text-foreground/80 ${
              isActive(`/${locale}`) ? "text-foreground" : "text-foreground/60"
            }`}
          >
            {t("home")}
          </Link>
          <Link
            href={`/${locale}/brands`}
            className={`transition-colors hover:text-foreground/80 ${
              isActive(`/${locale}/brands`) ? "text-foreground" : "text-foreground/60"
            }`}
          >
            {t("brands")}
          </Link>
          <Link
            href={`/${locale}/contact`}
            className={`transition-colors hover:text-foreground/80 ${
              isActive(`/${locale}/contact`) ? "text-foreground" : "text-foreground/60"
            }`}
          >
            {t("contact")}
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <Button variant="ghost" size="sm" onClick={() => setIsSearchOpen(true)} className="hidden sm:flex">
            <Search className="h-4 w-4" />
            <span className="sr-only">{t("search")}</span>
          </Button>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* User Authentication */}
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <UserNav user={user} onLogout={handleLogout} />
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${locale}/auth/signin`}>
                  <UserIcon className="h-4 w-4 mr-2" />
                  {t("signIn")}
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/${locale}/auth/register`}>{t("signUp")}</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <MobileNav user={user} onLogout={handleLogout} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search Dialog */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  )
}
