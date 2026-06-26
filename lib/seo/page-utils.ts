export function formatBrandModelName(brandName?: string | null, modelName?: string | null) {
  const brand = (brandName || "").trim()
  const model = (modelName || "").trim()

  if (!brand) return model
  if (!model) return brand

  const normalizedBrand = brand.toLocaleLowerCase()
  const normalizedModel = model.toLocaleLowerCase()

  if (normalizedModel === normalizedBrand || normalizedModel.startsWith(`${normalizedBrand} `)) {
    return model
  }

  return `${brand} ${model}`
}

// How users actually search a product line (series). Apple is the special case:
// nobody searches "Apple iPhone" / "oprava Apple" — they search "iPhone", "iPad".
// For every other brand the brand word IS part of the query ("Samsung Galaxy S",
// "Xiaomi Redmi Note"), so prepend it unless the series name already includes it.
export function lineupLabel(seriesName?: string | null, brandName?: string | null) {
  const series = (seriesName || "").trim()
  const brand = (brandName || "").trim()

  if (!series) return brand
  if (!brand) return series

  if (brand.toLocaleLowerCase() === "apple") return series

  const normalizedBrand = brand.toLocaleLowerCase()
  const normalizedSeries = series.toLocaleLowerCase()
  // Don't double up when the series already leads with the brand word, whatever
  // follows it — handles "Xiaomi" and "Xiaomi (Mi)" alike.
  if (normalizedSeries === normalizedBrand || normalizedSeries.startsWith(normalizedBrand)) {
    return series
  }

  return `${brand} ${series}`
}

// Model name as people actually search it, for SEO titles/descriptions. Apple is
// the special case — drop the brand ("iPhone 16 Pro Max", not "Apple iPhone 16
// Pro Max"); every other brand keeps the brand word via formatBrandModelName
// ("Xiaomi Redmi 15C", "Samsung S26 Ultra").
export function seoModelName(brandName?: string | null, modelName?: string | null) {
  const brand = (brandName || "").trim()
  const model = (modelName || "").trim()

  if (!brand) return model
  if (!model) return brand
  if (brand.toLocaleLowerCase() === "apple") return model

  return formatBrandModelName(brand, model)
}

// Trim disambiguating parentheticals (e.g. "(6. generace)") from a name for the
// <title>, but ONLY when a 4-digit year is also present to carry the distinction
// — otherwise the parenthetical is the only differentiator, so keep it.
// "iPad Pro 12,9″ (6. generace) 2022" → "iPad Pro 12,9″ 2022".
export function shortModelTitle(modelName?: string | null) {
  const name = (modelName || "").trim()
  if (!/\([^)]*\)/.test(name)) return name
  if (!/\b(?:19|20)\d{2}\b/.test(name)) return name
  return name
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
}

// Lowercase only the first character (keeps "(Original)" etc. intact), for
// dropping a service name into the middle of a sentence.
export function lowerFirst(s?: string | null) {
  const str = (s || "").trim()
  if (!str) return str
  return str.charAt(0).toLocaleLowerCase() + str.slice(1)
}

export function stripBrandFromModelName(brandName?: string | null, modelName?: string | null) {
  const brand = (brandName || "").trim()
  const model = (modelName || "").trim()

  if (!brand || !model) return model

  const normalizedBrand = brand.toLocaleLowerCase()
  const normalizedModel = model.toLocaleLowerCase()

  if (normalizedModel === normalizedBrand) return ""
  if (normalizedModel.startsWith(`${normalizedBrand} `)) {
    return model.slice(brand.length).trim()
  }

  return model
}
