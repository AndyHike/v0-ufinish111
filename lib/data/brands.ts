import { createClient } from "@/utils/supabase/server"

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

export async function getBrands(): Promise<Brand[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, position, series(id, name, position, slug)")
      .order("position", { ascending: true, nullsLast: true })
      .order("name", { ascending: true })
      .limit(12) // Limit to 12 brands for better performance

    if (error) {
      console.error("Error fetching brands:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching brands:", error)
    return []
  }
}
