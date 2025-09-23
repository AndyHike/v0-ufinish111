/**
 * Форматує URL зображення для правильного відображення
 * Обробляє як локальні, так і віддалені URL
 */
export function formatImageUrl(url: string | null | undefined): string {
  if (!url) {
    return "/abstract-geometric-shapes.png"
  }

  // Якщо URL починається з http або https, повертаємо його як є
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  // Якщо URL починається з /, вважаємо його локальним
  if (url.startsWith("/")) {
    return url
  }

  // Інакше додаємо / на початку
  return `/${url}`
}

/**
 * Generates responsive image sizes for mobile optimization
 */
export function getResponsiveImageSizes(breakpoints?: {
  mobile?: number
  tablet?: number
  desktop?: number
}): string {
  const { mobile = 100, tablet = 50, desktop = 33 } = breakpoints || {}
  return `(max-width: 640px) ${mobile}vw, (max-width: 1024px) ${tablet}vw, ${desktop}vw`
}

/**
 * Generates optimized placeholder for better LCP
 */
export function generateBlurDataURL(width = 10, height = 10): string {
  const canvas = typeof window !== "undefined" ? document.createElement("canvas") : null
  if (!canvas) {
    // Fallback blur data URL for SSR
    return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
  }

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (ctx) {
    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, width, height)
  }
  return canvas.toDataURL("image/jpeg", 0.1)
}

/**
 * Optimized image props for mobile performance
 */
export function getOptimizedImageProps(
  src: string,
  alt: string,
  options?: {
    priority?: boolean
    sizes?: string
    quality?: number
    placeholder?: "blur" | "empty"
  },
) {
  const { priority = false, sizes, quality = 85, placeholder = "blur" } = options || {}

  return {
    src: formatImageUrl(src),
    alt,
    quality,
    priority,
    sizes: sizes || getResponsiveImageSizes(),
    placeholder,
    blurDataURL: placeholder === "blur" ? generateBlurDataURL() : undefined,
    loading: priority ? "eager" : "lazy",
    decoding: "async",
  }
}

// Alias for backward compatibility
export const getImageUrl = formatImageUrl
