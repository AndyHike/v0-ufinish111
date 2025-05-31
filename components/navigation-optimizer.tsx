"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { preloadRoutes } from "@/lib/performance-optimizations"

export function NavigationOptimizer() {
  const pathname = usePathname()

  useEffect(() => {
    // Визначаємо можливі наступні маршрути на основі поточного шляху
    const possibleNextRoutes: string[] = []

    // Якщо ми на головній сторінці, ймовірно користувач перейде до брендів або послуг
    if (pathname === "/" || pathname.endsWith("/uk") || pathname.endsWith("/en") || pathname.endsWith("/cs")) {
      possibleNextRoutes.push("/brands", "/services", "/about", "/contact")
    }

    // Якщо ми на сторінці брендів, ймовірно користувач перейде до моделей
    if (pathname.includes("/brands")) {
      // Тут можна додати логіку для попереднього завантаження моделей
      // на основі популярних брендів
    }

    // Додаємо локалізовані шляхи
    const locales = ["uk", "en", "cs"]
    const localizedRoutes = possibleNextRoutes.flatMap((route) => locales.map((locale) => `/${locale}${route}`))

    // Попередньо завантажуємо маршрути
    preloadRoutes([...possibleNextRoutes, ...localizedRoutes])
  }, [pathname])

  return null // Цей компонент не рендерить нічого
}
