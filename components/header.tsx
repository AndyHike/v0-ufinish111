"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Smartphone, Search, Phone, Mail, MapPin, Home, MessageSquare } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { SearchDialog } from "@/components/search-dialog"
import { UserNav } from "@/components/user-nav"
import { useState } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { useSiteSettings } from "@/hooks/use-site-settings"

interface HeaderProps {
  user: any
  initialSettings?: {
    defaultLanguage: string
    siteLogo: string
    siteFavicon: string
  }
}

export function Header({ user, initialSettings }: HeaderProps) {
  const t = useTranslations("Header")
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Використовуємо initialSettings як початкові дані
  const { settings, loading } = useSiteSettings()
  const currentSettings = initialSettings || settings

  const navigation = [
    { name: t("home"), href: `/${locale}`, icon: <Home className="h-5 w-5" /> },
    { name: t("chooseModel"), href: `/${locale}/brands`, icon: <Smartphone className="h-5 w-5" /> },
    { name: t("contact"), href: `/${locale}/contact`, icon: <MessageSquare className="h-5 w-5" /> },
  ]

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === `/${locale}`) {
      return pathname === `/${locale}`
    }
    return pathname.startsWith(path)
  }

  // Функція для відображення логотипу
  const renderLogo = () => {
    if (currentSettings.siteLogo) {
      return (
        <div className="flex items-center gap-2">
          <img
            src={currentSettings.siteLogo || "/placeholder.svg"}
            alt="DeviceHelp"
            className="h-8 w-8 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              const parent = target.parentElement
              if (parent) {
                const fallback = document.createElement("div")
                fallback.innerHTML = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>`
                parent.insertBefore(fallback, target)
              }
            }}
          />
          <span className="hidden font-semibold md:inline-block">DeviceHelp</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <Smartphone className="h-5 w-5" />
        <span className="font-semibold">DeviceHelp</span>
      </div>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t("openMenu")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b py-4">
                    {currentSettings.siteLogo ? (
                      <img
                        src={currentSettings.siteLogo || "/placeholder.svg"}
                        alt="DeviceHelp"
                        className="h-8 w-8 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                        }}
                      />
                    ) : (
                      <Smartphone className="h-5 w-5" />
                    )}
                    <span className="font-semibold">DeviceHelp</span>
                  </div>
                  <nav className="flex-1 overflow-auto py-4">
                    <ul className="grid gap-2">
                      {navigation.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center rounded-md px-3 py-3 text-sm hover:bg-accent ${
                              isActive(item.href) ? "font-medium text-foreground bg-accent/50" : "text-muted-foreground"
                            }`}
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="border-t py-4 space-y-4">
                    <div className="px-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-sm">+42075848259</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-sm">info@devicehelp.cz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm">Praha 2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href={`/${locale}`} className="flex items-center">
              {renderLogo()}
            </Link>
          </div>
          <nav className="hidden md:flex md:gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm ${
                  isActive(item.href) ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="flex" />
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} aria-label={t("search")}>
              <Search className="h-5 w-5" />
            </Button>
            <UserNav user={user} />
          </div>
        </div>
        <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </header>

      <MobileNav navigation={navigation} isActive={isActive} />
    </>
  )
}
