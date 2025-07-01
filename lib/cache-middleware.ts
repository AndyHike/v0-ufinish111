// Простий in-memory кеш для middleware
interface CacheItem {
  value: any
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheItem>()

  set(key: string, value: any, ttlSeconds = 300) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  clear() {
    this.cache.clear()
  }
}

export const middlewareCache = new SimpleCache()
