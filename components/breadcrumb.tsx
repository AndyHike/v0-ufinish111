"use client"

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
  return (
    <nav
      className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Home link */}
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        title="Домашня сторінка"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Домашня</span>
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={`${item.href}-${index}`} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />

            {isLast ? (
              // Last item - not a link
              <span className="text-foreground font-medium truncate">{item.label}</span>
            ) : (
              // Navigation links
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors truncate"
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
