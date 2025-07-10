"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  MessageSquare,
  Settings,
  Percent,
  FileText,
  BarChart3,
  Smartphone,
  Wrench,
  Upload,
  FolderSyncIcon as Sync,
  Zap,
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
    icon: Wrench,
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
    icon: FileText,
  },
  {
    title: "Масовий імпорт",
    href: "/admin/bulk-import",
    icon: Upload,
  },
  {
    title: "Масові послуги",
    href: "/admin/bulk-services",
    icon: Package,
  },
  {
    title: "Синхронізація",
    href: "/admin/sync",
    icon: Sync,
  },
  {
    title: "RemOnline синхронізація",
    href: "/admin/remonline-sync",
    icon: Zap,
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
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
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
