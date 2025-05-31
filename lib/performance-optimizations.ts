/**
 * Утиліти для оптимізації продуктивності сайту
 */

// Функція для попереднього завантаження зображень
export function preloadImages(urls: string[]) {
  if (typeof window === "undefined") return

  urls.forEach((url) => {
    if (!url) return
    const img = new Image()
    img.src = url
  })
}

// Функція для попереднього завантаження маршрутів
export function preloadRoutes(routes: string[]) {
  if (typeof window === "undefined") return

  routes.forEach((route) => {
    const link = document.createElement("link")
    link.rel = "prefetch"
    link.href = route
    document.head.appendChild(link)
  })
}

// Функція для оптимізації кешування
export function optimizeCaching() {
  if (typeof window === "undefined") return

  // Встановлюємо заголовки кешування для статичних ресурсів
  if ("caches" in window) {
    caches.open("static-resources").then((cache) => {
      // Кешуємо основні статичні ресурси
      const resourcesToCache = ["/favicon.ico", "/manifest.json", "/logo.png"]
      cache.addAll(resourcesToCache)
    })
  }
}
