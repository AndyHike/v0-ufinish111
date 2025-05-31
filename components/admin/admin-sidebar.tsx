"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Box,
  CircleDollarSign,
  Smartphone,
  Tag,
  Users,
  Settings,
  Layers,
  Repeat,
  FileSpreadsheet,
  Wrench,
  Database,
  AlertCircle,
  MessageSquare,
} from "lucide-react"

export function AdminSidebar() {
  const t = useTranslations("Admin")
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  const navItems = [
    {
      title: t("dashboard"),
      href: "/admin",
      icon: BarChart3,
      active: pathname === "/admin",
    },
    {
      title: t("brands"),
      href: "/admin/brands",
      icon: Tag,
      active: isActive("/admin/brands"),
    },
    {
      title: t("series") || "Series",
      href: "/admin/series",
      icon: Layers,
      active: isActive("/admin/series"),
    },
    {
      title: t("models"),
      href: "/admin/models",
      icon: Smartphone,
      active: isActive("/admin/models"),
    },
    {
      title: t("descriptions"),
      href: "/admin/descriptions",
      icon: Box,
      active: isActive("/admin/descriptions"),
    },
    {
      title: t("discounts"),
      href: "/admin/discounts",
      icon: CircleDollarSign,
      active: isActive("/admin/discounts"),
    },
    {
      title: t("orderStatuses") || "Order Statuses",
      href: "/admin/order-statuses",
      icon: Wrench,
      active: isActive("/admin/order-statuses"),
    },
    {
      title: t("users"),
      href: "/admin/users",
      icon: Users,
      active: isActive("/admin/users"),
    },
    {
      title: t("bulkServices") || "Bulk Services",
      href: "/admin/bulk-services",
      icon: FileSpreadsheet,
      active: isActive("/admin/bulk-services"),
    },
    {
      title: t("sync") || "Sync",
      href: "/admin/sync",
      icon: Repeat,
      active: isActive("/admin/sync"),
    },
    {
      title: t("infoBanner") || "Info Banner",
      href: "/admin/banner",
      icon: AlertCircle,
      active: isActive("/admin/banner"),
    },
    {
      title: t("contactMessages") || "Messages",
      href: "/admin/contact-messages",
      icon: MessageSquare,
      active: isActive("/admin/contact-messages"),
    },
    {
      title: t("settings"),
      href: "/admin/settings",
      icon: Settings,
      active: isActive("/admin/settings"),
    },
    {
      title: t("bulkImport"),
      href: `/admin/bulk-import`,
      icon: Database,
      active: isActive("/admin/bulk-import"),
    },
  ]

  return (
    <nav className="grid items-start px-2 py-4 lg:px-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
            item.active
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      ))}
    </nav>
  )
}
