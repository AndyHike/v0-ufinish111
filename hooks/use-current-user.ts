"use client"

import { useEffect, useState } from "react"
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
  const router = useRouter()

  const fetchUser = async () => {
    console.log("[v0] useCurrentUser - Fetching user...")
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
        console.log("[v0] useCurrentUser - User fetched:", data.user ? data.user.email : "null")
        setUser(data.user)
      } else {
        console.log("[v0] useCurrentUser - Response not OK:", response.status)
        setUser(null)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch user:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    const interval = setInterval(() => {
      fetchUser()
    }, 3000) // Check every 3 seconds

    return () => clearInterval(interval)
  }, [])

  const refresh = () => {
    setIsLoading(true)
    fetchUser()
    router.refresh()
  }

  return { user, isLoading, refresh }
}
