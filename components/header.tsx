"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { LanguageSwitcher } from "./language-switcher"
import { UserNav } from "./user-nav"
import { SiteLogo } from "./site-logo"
import { SearchDialog } from "./search-dialog"
import { MobileNav } from "./mobile-nav"

export function Header() {
  const t = useTranslations("Navigation")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <SiteLogo />
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
                {t("home")}
              </Link>
              <Link href="/brands" className="transition-colors hover:text-foreground/80 text-foreground/60">
                {t("brands")}
              </Link>
              <Link href="/contact" className="transition-colors hover:text-foreground/80 text-foreground/60">
                {t("contact")}
              </Link>
            </nav>
          </div>

          <MobileNav />

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Button
                variant="outline"
                className="inline-flex items-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline-flex">{t("searchPlaceholder")}</span>
                <span className="inline-flex lg:hidden">{t("search")}</span>
                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            <nav className="flex items-center space-x-2">
              <LanguageSwitcher />
              <UserNav />
            </nav>
          </div>
        </div>
      </header>

      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  )
}
