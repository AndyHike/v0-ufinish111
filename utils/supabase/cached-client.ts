import { createServerClient } from "@/utils/supabase/server"
import { clientCache, createCacheKey } from "@/lib/cache"

// Кешовані функції для отримання даних
export async function getCachedBrands() {
  const cacheKey = createCacheKey("brands", {})
  const cached = clientCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const supabase = createServerClient()
  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, position")
    .order("position", { ascending: true })

  if (!error && brands) {
    clientCache.set(cacheKey, brands, 10) // кешуємо на 10 хвилин
  }

  return brands
}

export async function getCachedBrand(slug: string) {
  const cacheKey = createCacheKey("brand", { slug })
  const cached = clientCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const supabase = createServerClient()

  // Спочатку спробуємо знайти за слагом
  let { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*, series(id, name, slug, position)")
    .eq("slug", slug)
    .single()

  // Якщо не знайдено за слагом, спробуємо знайти за ID
  if (!brand) {
    const { data, error } = await supabase
      .from("brands")
      .select("*, series(id, name, slug, position)")
      .eq("id", slug)
      .single()

    brand = data
    brandError = error
  }

  if (!brandError && brand) {
    clientCache.set(cacheKey, brand, 10) // кешуємо на 10 хвилин
  }

  return { brand, error: brandError }
}

export async function getCachedSeries(slug: string) {
  const cacheKey = createCacheKey("series", { slug })
  const cached = clientCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const supabase = createServerClient()

  // Спочатку спробуємо знайти за слагом
  let { data: series, error: seriesError } = await supabase
    .from("series")
    .select("*, brands(id, name, slug, logo_url)")
    .eq("slug", slug)
    .single()

  // Якщо не знайдено за слагом, спробуємо знайти за ID
  if (!series) {
    const { data, error } = await supabase
      .from("series")
      .select("*, brands(id, name, slug, logo_url)")
      .eq("id", slug)
      .single()

    series = data
    seriesError = error
  }

  if (!seriesError && series) {
    clientCache.set(cacheKey, series, 10) // кешуємо на 10 хвилин
  }

  return { series, error: seriesError }
}

export async function getCachedModelsForSeries(seriesId: string) {
  const cacheKey = createCacheKey("models_for_series", { seriesId })
  const cached = clientCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const supabase = createServerClient()
  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select("id, name, slug, image_url, created_at")
    .eq("series_id", seriesId)
    .order("position", { ascending: true })

  if (!modelsError && models) {
    clientCache.set(cacheKey, models, 10) // кешуємо на 10 хвилин
  }

  return { models, error: modelsError }
}

export async function getCachedModelsWithoutSeries(brandId: string) {
  const cacheKey = createCacheKey("models_without_series", { brandId })
  const cached = clientCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const supabase = createServerClient()
  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select("id, name, slug, image_url")
    .eq("brand_id", brandId)
    .is("series_id", null)
    .order("position", { ascending: true })

  if (!modelsError && models) {
    clientCache.set(cacheKey, models, 10) // кешуємо на 10 хвилин
  }

  return { models, error: modelsError }
}
