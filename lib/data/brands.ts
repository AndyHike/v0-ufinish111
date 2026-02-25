import { createClient } from "@/utils/supabase/server"
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
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, position, series(id, name, position, slug)")
      .order("position", { ascending: true, nullsLast: true })
      .order("name", { ascending: true })
      .limit(12)

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching brands:", error)
      }
      return []
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Unexpected error fetching brands:", error)
    }
    return []
  }
})

// Экспортуємо функцію для ISR тегів
export { BRAND_CACHE_REVALIDATE }
