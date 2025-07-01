import { unstable_cache } from "next/cache"
import { createClient } from "@/utils/supabase/server"

// Створюємо кешований клієнт Supabase
export function createCachedSupabaseClient() {
  const supabase = createClient()

  return {
    // Кешований запит брендів
    getBrands: unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from("brands")
          .select("id, name, slug, logo_url, position")
          .order("position", { ascending: true })

        if (error) {
          console.error("Error fetching brands:", error)
          return []
        }

        return data || []
      },
      ["brands-list"],
      {
        revalidate: 300, // 5 хвилин
        tags: ["brands"],
      },
    ),

    // Кешований запит конкретного бренду
    getBrandBySlug: unstable_cache(
      async (slug: string) => {
        const { data, error } = await supabase
          .from("brands")
          .select("id, name, slug, logo_url, description")
          .eq("slug", slug)
          .single()

        if (error) {
          console.error("Error fetching brand:", error)
          return null
        }

        return data
      },
      ["brand-by-slug"],
      {
        revalidate: 600, // 10 хвилин
        tags: ["brands"],
      },
    ),

    // Кешований запит серій бренду
    getSeriesByBrandId: unstable_cache(
      async (brandId: string) => {
        const { data, error } = await supabase
          .from("series")
          .select("id, name, slug, brand_id, position")
          .eq("brand_id", brandId)
          .order("position", { ascending: true })

        if (error) {
          console.error("Error fetching series:", error)
          return []
        }

        return data || []
      },
      ["series-by-brand"],
      {
        revalidate: 300, // 5 хвилин
        tags: ["series"],
      },
    ),

    // Кешований запит моделей серії
    getModelsBySeriesId: unstable_cache(
      async (seriesId: string) => {
        const { data, error } = await supabase
          .from("models")
          .select("id, name, slug, series_id, position")
          .eq("series_id", seriesId)
          .order("position", { ascending: true })

        if (error) {
          console.error("Error fetching models:", error)
          return []
        }

        return data || []
      },
      ["models-by-series"],
      {
        revalidate: 300, // 5 хвилин
        tags: ["models"],
      },
    ),

    // Кешований запит послуг
    getServices: unstable_cache(
      async () => {
        const { data, error } = await supabase
          .from("services")
          .select("id, name, slug, description, price, duration")
          .eq("active", true)
          .order("position", { ascending: true })

        if (error) {
          console.error("Error fetching services:", error)
          return []
        }

        return data || []
      },
      ["services-list"],
      {
        revalidate: 600, // 10 хвилин
        tags: ["services"],
      },
    ),

    // Оригінальний клієнт для адмін операцій (без кешу)
    raw: supabase,
  }
}

// Функція для очищення кешу
export async function revalidateCache(tags: string[]) {
  const { revalidateTag } = await import("next/cache")

  for (const tag of tags) {
    revalidateTag(tag)
  }
}
