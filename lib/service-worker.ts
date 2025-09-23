"use client"

// Service Worker registration utility
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {}

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager()
    }
    return ServiceWorkerManager.instance
  }

  async register(): Promise<boolean> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.log("Service Worker not supported")
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })

      console.log("Service Worker registered successfully")

      // Handle updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration?.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available
              this.showUpdateNotification()
            }
          })
        }
      })

      return true
    } catch (error) {
      console.error("Service Worker registration failed:", error)
      return false
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false

    try {
      const result = await this.registration.unregister()
      console.log("Service Worker unregistered")
      return result
    } catch (error) {
      console.error("Service Worker unregistration failed:", error)
      return false
    }
  }

  private showUpdateNotification() {
    // You can implement a toast notification here
    console.log("New version available! Please refresh the page.")

    // Auto-refresh after a delay (optional)
    setTimeout(() => {
      if (confirm("A new version is available. Refresh now?")) {
        window.location.reload()
      }
    }, 3000)
  }

  async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update()
    }
  }

  // Preload critical resources
  async preloadCriticalResources(urls: string[]): Promise<void> {
    if (!("caches" in window)) return

    try {
      const cache = await caches.open("devicehelp-preload-v1")
      await Promise.all(
        urls.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok) {
                cache.put(url, response.clone())
              }
              return response
            })
            .catch(console.error),
        ),
      )
    } catch (error) {
      console.error("Failed to preload resources:", error)
    }
  }
}

// Hook for React components
export function useServiceWorker() {
  const swManager = ServiceWorkerManager.getInstance()

  const register = () => swManager.register()
  const unregister = () => swManager.unregister()
  const checkForUpdates = () => swManager.checkForUpdates()
  const preloadResources = (urls: string[]) => swManager.preloadCriticalResources(urls)

  return {
    register,
    unregister,
    checkForUpdates,
    preloadResources,
  }
}
