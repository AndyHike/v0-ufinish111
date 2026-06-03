import { createClient } from "@supabase/supabase-js"
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

function hasSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && key && !url.includes("placeholder.supabase.co") && key !== "placeholder-key")
}

function createPublicSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
    auth: {
      persistSession: false,
    },
  })
}

export const getBrands = cache(async (): Promise<Brand[]> => {
  try {
    console.log("[v0] getBrands() called - checking cache...")
    if (!hasSupabaseConfig()) {
      return []
    }

    const supabase = createPublicSupabaseClient()

    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, position, series(id, name, position, slug)")
      .order("position", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true })
      .limit(12)

    if (error) {
      console.warn("[v0] Error fetching brands:", error)
      return []
    }

    console.log(`[v0] getBrands() returned ${data?.length || 0} brands from Supabase`)
    return data || []
  } catch (error) {
    console.warn("[v0] Unexpected error in getBrands():", error)
    return []
  }
})

// Экспортуємо функцію для ISR тегів
export { BRAND_CACHE_REVALIDATE }
