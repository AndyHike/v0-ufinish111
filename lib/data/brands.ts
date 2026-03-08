import { createClient } from "@/utils/supabase/client"
import { cache } from "react"
import { revalidateTag } from "next/cache"

export type Brand = {
  id: string
  name: string
  logo_url: string | null
  position: number | null
  slug: string | null
  series:
  | {
    id: string
    name: string
    position: number
    slug: string | null
  }[]
  | null
}

// ISR cache - 1 година (3600 секунд)
const BRAND_CACHE_REVALIDATE = 3600

export const getBrands = cache(async (): Promise<Brand[]> => {
  try {
    console.log("[v0] getBrands() called - checking cache...")
    const supabase = createClient()

    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, position, series(id, name, position, slug)")
      .order("position", { ascending: true, nullsLast: true })
      .order("name", { ascending: true })
      .limit(12)

    if (error) {
      console.error("[v0] Error fetching brands:", error)
      return []
    }

    console.log(`[v0] getBrands() returned ${data?.length || 0} brands from Supabase`)
    return data || []
  } catch (error) {
    console.error("[v0] Unexpected error in getBrands():", error)
    return []
  }
})

// Экспортуємо функцію для ISR тегів
export { BRAND_CACHE_REVALIDATE }
