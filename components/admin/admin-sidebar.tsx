"use client"

import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  MessageSquare,
  BarChart3,
  Smartphone,
  Tag,
  FileText,
  Wrench,
  Layers,
  Upload,
  FolderSyncIcon as Sync,
  Shield,
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
    icon: Smartphone,
  },
  {
    title: "Серії",
    href: "/admin/series",
    icon: Layers,
  },
  {
    title: "Моделі",
    href: "/admin/models",
    icon: Package,
  },
  {
    title: "Послуги",
    href: "/admin/services",
    icon: Wrench,
  },
  {
    title: "Описи",
    href: "/admin/descriptions",
    icon: FileText,
  },
  {
    title: "Знижки",
    href: "/admin/discounts",
    icon: Tag,
  },
  {
    title: "Статуси замовлень",
    href: "/admin/order-statuses",
    icon: Shield,
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
    title: "Масовий імпорт",
    href: "/admin/bulk-import",
    icon: Upload,
  },
  {
    title: "Масові послуги",
    href: "/admin/bulk-services",
    icon: Upload,
  },
  {
    title: "Синхронізація",
    href: "/admin/sync",
    icon: Sync,
  },
  {
    title: "Інтеграції",
    href: "/admin/integrations",
    icon: BarChart3,
  },
  {
    title: "Банер",
    href: "/admin/banner",
    icon: BarChart3,
  },
  {
    title: "Налаштування",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Адмін панель</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => {
          const href = `/${locale}${item.href}`
          const isActive = pathname === href
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
