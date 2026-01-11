"use client"

import { useEffect, useState } from "use router"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  role: string
  name: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  avatar_url?: string | null
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldRefreshRouter, setShouldRefreshRouter] = useState(false)
  const router = useRouter()

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user/current", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (shouldRefreshRouter) {
      router.refresh()
      setShouldRefreshRouter(false)
    }
  }, [shouldRefreshRouter, router])

  const refresh = () => {
    setIsLoading(true)
    fetchUser()
    setShouldRefreshRouter(true)
  }

  return { user, isLoading, refresh }
}
