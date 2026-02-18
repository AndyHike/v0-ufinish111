import { createClient } from "@/utils/supabase/server"
import { cache } from "react"

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

export const getBrands = cache(async (): Promise<Brand[]> => {
  try {
    const supabase = createClient()

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
