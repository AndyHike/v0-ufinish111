"use client"

import { useState, useEffect } from "react"

interface SiteSettings {
  defaultLanguage: string
  siteLogo: string
  siteFavicon: string
}

const CACHE_KEY = "site-settings"
const CACHE_DURATION = 10 * 60 * 1000 // 10 хвилин кеш

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    // Спробуємо отримати з кешу при ініціалізації
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_DURATION) {
            return data
          }
        }
      } catch (error) {
        console.error("Error reading from cache:", error)
      }
    }

    return {
      defaultLanguage: "uk",
      siteLogo: "",
      siteFavicon: "/favicon.ico",
    }
  })

  const [loading, setLoading] = useState(!settings.siteLogo) // Якщо є кешований логотип, не показуємо loading
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/site-settings")
        if (!response.ok) {
          throw new Error("Failed to fetch settings")
        }
        const data = await response.json()

        // Якщо є логотип, preload його
        if (data.siteLogo) {
          const img = new Image()
          img.onload = () => {
            setSettings(data)
            setLoading(false)

            // Зберігаємо в кеш після успішного завантаження
            try {
              localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({
                  data,
                  timestamp: Date.now(),
                }),
              )
            } catch (error) {
              console.error("Error saving to cache:", error)
            }
          }
          img.onerror = () => {
            // При помилці завантаження логотипу, зберігаємо налаштування без логотипу
            setSettings({ ...data, siteLogo: "" })
            setLoading(false)
          }
          img.src = data.siteLogo
        } else {
          setSettings(data)
          setLoading(false)

          // Зберігаємо в кеш навіть якщо немає логотипу
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                data,
                timestamp: Date.now(),
              }),
            )
          } catch (error) {
            console.error("Error saving to cache:", error)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setLoading(false)
        console.error("Error fetching site settings:", err)
      }
    }

    // Якщо немає кешованих даних або вони застарілі
    if (!settings.siteLogo || loading) {
      fetchSettings()
    }
  }, [settings.siteLogo, loading])

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY)
    setLoading(true)
  }

  return { settings, loading, error, clearCache }
}
