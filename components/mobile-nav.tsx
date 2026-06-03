"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Smartphone, MessageSquare, Wrench } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { mainSiteUrl } from "@/lib/site-config"
import { useEffect, useState } from "react"

interface MobileNavProps {
  variant?: "default" | "b2b"
  mainDomainBaseUrl?: string
  localeOverride?: string
}

export function MobileNav({ variant = "default", mainDomainBaseUrl = mainSiteUrl, localeOverride }: MobileNavProps) {
  const pathname = usePathname()
  const t = useTranslations()
  const [isVisible, setIsVisible] = useState(true)

  // Extract locale from pathname
  const locale = localeOverride || pathname.split("/")[1] || "cs"
  const isB2BVariant = variant === "b2b"
  const visiblePathname =
    isB2BVariant && pathname.startsWith("/b2b/")
      ? pathname.replace(/^\/b2b/, "") || `/${locale}`
      : pathname

  useEffect(() => {
    let lastScrollY = 0

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show nav when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`
    if (path === "/") {
      return visiblePathname === `/${locale}` || visiblePathname === `/${locale}/`
    }
    return visiblePathname === fullPath || visiblePathname?.startsWith(fullPath + "/")
  }

  const mainDomain = mainDomainBaseUrl.replace(/\/$/, "")
  const defaultNavigation = [
    {
      name: t("Header.home"),
      href: `/${locale}`,
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: t("Header.chooseModel"),
      href: `/${locale}/brands`,
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      name: t("Header.articles"),
      href: `/${locale}/articles`,
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      name: t("Header.contact"),
      href: `/${locale}/contact`,
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ]

  const b2bNavigation = [
    {
      name: t("Header.b2bHome"),
      href: `/${locale}`,
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: t("Header.b2bBenefits"),
      href: `/${locale}#benefits`,
      icon: <Wrench className="h-5 w-5" />,
    },
    {
      name: t("Header.businessAccount"),
      href: `/${locale}#account`,
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      name: t("Header.b2bFaq"),
      href: `/${locale}/faq`,
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ]

  const navigation = isB2BVariant ? b2bNavigation : defaultNavigation

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t py-2 px-4 shadow-lg transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center">
        {navigation.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center p-1",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center mb-1 w-full rounded-full p-1 transition-all duration-200",
                  active ? "bg-primary/10" : "hover:bg-gray-100",
                )}
              >
                {item.icon}
              </div>
              <span className="text-xs text-center w-full truncate">{item.name}</span>
              {active && (
                <span
                  className="absolute -bottom-2 left-1/2 w-1 h-1 bg-primary rounded-full"
                  style={{ transform: "translateX(-50%)" }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
