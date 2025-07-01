"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function NavigationProgress() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    // Перевіряємо чи це повільна сторінка
    const isSlowPage =
      pathname.includes("/brands") ||
      pathname.includes("/series") ||
      pathname.includes("/models") ||
      pathname.includes("/services")

    if (isSlowPage) {
      setIsLoading(true)
      setProgress(10)

      // Симулюємо прогрес завантаження
      const timer1 = setTimeout(() => setProgress(30), 100)
      const timer2 = setTimeout(() => setProgress(60), 300)
      const timer3 = setTimeout(() => setProgress(90), 600)
      const timer4 = setTimeout(() => {
        setProgress(100)
        setTimeout(() => setIsLoading(false), 200)
      }, 1000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
      }
    }
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-primary transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
    </div>
  )
}
