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
