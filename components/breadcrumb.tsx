"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const pathname = usePathname()
  // Extract locale from pathname
  const locale = pathname.split("/")[1] || "cs"
  const homeHref = `/${locale}`

  return (
    <nav
      className={`flex flex-wrap items-center gap-y-2 gap-x-2 text-sm text-muted-foreground ${className} max-w-full overflow-hidden`}
      aria-label="Breadcrumb"
    >
      {/* Home link */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link
          href={homeHref}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          title="Домашня сторінка"
        >
          <Home className="h-4 w-4" />
          <span className="sr-only">Домашня</span>
        </Link>
      </div>

      {/* Breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={`${item.href}-${index}`} className="flex items-center gap-2 min-w-0">
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />

            {isLast ? (
              // Last item - not a link
              <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-[300px]">
                {item.label}
              </span>
            ) : (
              // Navigation links
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
