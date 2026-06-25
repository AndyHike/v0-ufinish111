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
