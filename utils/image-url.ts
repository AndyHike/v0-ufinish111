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

// Alias for backward compatibility
export const getImageUrl = formatImageUrl
