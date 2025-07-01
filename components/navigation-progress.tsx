"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const handleStart = () => setIsLoading(true)
    const handleComplete = () => setIsLoading(false)

    // Симулюємо початок навігації
    handleStart()

    // Симулюємо завершення навігації через короткий час
    const timer = setTimeout(handleComplete, 100)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-blue-200">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out animate-pulse"
          style={{ width: "30%" }}
        />
      </div>
    </div>
  )
}
