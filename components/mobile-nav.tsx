"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Smartphone, MessageSquare, Wrench } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function MobileNav() {
  const pathname = usePathname()
  const t = useTranslations()
  const [isVisible, setIsVisible] = useState(true)

  // Extract locale from pathname
  const locale = pathname.split("/")[1] || "cs"

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
      return pathname === `/${locale}` || pathname === `/${locale}/`
    }
    return pathname === fullPath || pathname?.startsWith(fullPath + "/")
  }

  const navigation = [
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

  return (
    <motion.div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t py-2 px-4 shadow-lg"
      animate={{ translateY: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-around items-center">
        {navigation.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-1/4 p-1 relative",
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
                <motion.span
                  className="absolute -bottom-2 left-1/2 w-1 h-1 bg-primary rounded-full"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ translateX: "-50%" }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </motion.div>
  )
}
