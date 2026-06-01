"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  Tags,
  Smartphone,
  Users,
  Settings,
  MessageSquare,
  Percent,
  FileText,
  BarChart3,
  Upload,
  ArrowLeftRight,
  Megaphone,
  BookOpen,
  Shield,
  RefreshCw,
} from "lucide-react"

const sidebarItems = [
  {
    title: "Панель управління",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Бренди",
    href: "/admin/brands",
    icon: Package,
  },
  {
    title: "Серії",
    href: "/admin/series",
    icon: Tags,
  },
  {
    title: "Моделі",
    href: "/admin/models",
    icon: Smartphone,
  },
  {
    title: "Послуги",
    href: "/admin/services",
    icon: FileText,
  },
  {
    title: "Статті",
    href: "/admin/articles",
    icon: BookOpen,
  },
  {
    title: "Імпорт/Експорт",
    href: "/admin/import-export",
    icon: ArrowLeftRight,
  },
  {
    title: "Користувачі",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Ролі",
    href: "/admin/roles",
    icon: Shield,
  },
  {
    title: "Повідомлення",
    href: "/admin/contact-messages",
    icon: MessageSquare,
  },
  {
    title: "Знижки",
    href: "/admin/discounts",
    icon: Percent,
  },
  {
    title: "Статуси замовлень",
    href: "/admin/order-statuses",
    icon: BarChart3,
  },
  {
    title: "RemOnline замовлення",
    href: "/admin/remonline-orders",
    icon: RefreshCw,
  },
  {
    title: "Банер",
    href: "/admin/banner",
    icon: Upload,
  },
  {
    title: "Акційний банер",
    href: "/admin/promotional-banner",
    icon: Megaphone,
  },
  {
    title: "Налаштування",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-full shrink-0 border-b bg-background md:h-screen md:w-64 md:border-b-0 md:border-r md:overflow-y-auto">
      <div className="space-y-3 py-3 md:space-y-4 md:py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Адміністрування</h2>
          <div className="flex gap-1 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-x-visible md:pb-0">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.endsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "transparent",
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
