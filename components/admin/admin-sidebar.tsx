import { BarChart, LayoutDashboard, ListChecks, Palette, Settings, ShoppingCart } from "lucide-react"

import type { NavItem } from "@/types"

interface Props {
  isCollapsed: boolean
}

export const AdminSidebar = ({ isCollapsed }: Props) => {
  const routes: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Products",
      href: "/admin/products",
      icon: ShoppingCart,
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: ListChecks,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: BarChart,
    },
    {
      title: "Branding",
      href: "/admin/branding",
      icon: Palette,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="flex flex-col w-full">
      <div className="border-b">
        {routes.map((route) => (
          <div key={route.href}>{route.title}</div>
        ))}
      </div>
    </div>
  )
}
