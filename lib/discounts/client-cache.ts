export interface CachedDiscountBatch {
    [serviceId: string]: {
        discountedPrice: number | null
        hasDiscount: boolean
        discount: any | null
        actualDiscountPercentage: number | null
    }
}

// In-memory cache for the client side.
// This cache lives only as long as the React application is loaded (in the browser).
// A hard refresh (F5) will clear it, pulling fresh data, but SPA navigation will hit the cache.
class DiscountClientCache {
    private cache: Map<string, CachedDiscountBatch> = new Map()

    /**
     * Get a cache key based on the services and model.
     * If the user is logged in, their session cookie determines their discount,
     * but since this cache gets blown away on reload, 
     * we just need a key for the model + services combination.
     */
    private getCacheKey(modelId: string, serviceIds: string[]): string {
        const sortedServiceIds = [...serviceIds].sort()
        return `${modelId}::${sortedServiceIds.join(',')}`
    }

    get(modelId: string, serviceIds: string[]): CachedDiscountBatch | null {
        const key = this.getCacheKey(modelId, serviceIds)
        return this.cache.get(key) || null
    }

    set(modelId: string, serviceIds: string[], data: CachedDiscountBatch): void {
        const key = this.getCacheKey(modelId, serviceIds)
        this.cache.set(key, data)
    }

    clear(): void {
        this.cache.clear()
    }
}

// Export a singleton instance
export const discountCache = new DiscountClientCache()
