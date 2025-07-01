// Простий in-memory кеш для клієнтської сторони
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlMinutes = 5) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000, // конвертуємо в мілісекунди
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    // Перевіряємо, чи не застарів кеш
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

export const clientCache = new SimpleCache()

// Функція для створення ключа кешу
export function createCacheKey(type: string, params: Record<string, any>) {
  return `${type}:${JSON.stringify(params)}`
}
