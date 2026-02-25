import { unstable_cache } from "next/cache"

/**
 * Wrapper function to cache Supabase queries using Next.js unstable_cache
 * This bypasses Supabase cache-control headers and ensures ISR works properly
 * 
 * Usage:
 * const getCachedBrands = cached(() => supabase.from("brands").select("*"))
 */
export function cached<T>(
  fn: () => Promise<T>,
  name: string,
  options: { revalidate?: number; tags?: string[] } = {}
) {
  const { revalidate = 3600, tags = [] } = options
  
  return unstable_cache(fn, [name], {
    revalidate,
    tags: [name, ...tags],
  })
}

/**
 * Alternative: cache with custom key generation for dynamic queries
 */
export function cachedWithKey<T>(
  fn: () => Promise<T>,
  name: string,
  key: string | string[],
  options: { revalidate?: number; tags?: string[] } = {}
) {
  const { revalidate = 3600, tags = [] } = options
  const keyArray = Array.isArray(key) ? key : [key]
  
  return unstable_cache(fn, [...keyArray, name], {
    revalidate,
    tags: [name, ...tags],
  })
}
