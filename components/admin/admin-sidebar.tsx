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
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Адміністрування</h2>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
