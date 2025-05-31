"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Smartphone, Info, MessageSquare } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function MobileNav() {
  const pathname = usePathname()
  const t = useTranslations()

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/" || pathname === ""
    }
    return pathname === path || pathname?.startsWith(path + "/")
  }

  const navigation = [
    {
      name: t("Header.home"),
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: t("Header.chooseModel"),
      href: "/brands",
      icon: <Smartphone className="h-5 w-5" />,
    },
    {
      name: t("Header.about"),
      href: "/about",
      icon: <Info className="h-5 w-5" />,
    },
    {
      name: t("Header.contact"),
      href: "/contact",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t py-2 px-4 shadow-lg">
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
    </div>
  )
}
