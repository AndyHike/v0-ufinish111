import { createClient } from "@/utils/supabase/server"
import { cache } from "react"
import { unstable_cache } from "next/cache"

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

// Cache brands for 1 hour using Next.js unstable_cache
// This bypasses Supabase cache-control headers and ensures ISR works
const getCachedBrands = unstable_cache(
  async (): Promise<Brand[]> => {
    try {
      const supabase = await createClient()

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

      return data || []
    } catch (error) {
      console.error("[v0] Unexpected error in getBrands():", error)
      return []
    }
  },
  ["brands"], // cache tag
  { revalidate: 3600, tags: ["brands"] } // 1 hour ISR
)

export const getBrands = cache(getCachedBrands)
