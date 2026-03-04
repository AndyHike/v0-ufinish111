import { revalidatePath } from "next/cache"

const LOCALES = ["uk", "cs", "en"]

/**
 * Revalidate a path for all locales
 */
function revalidateForAllLocales(pathTemplate: string) {
  for (const locale of LOCALES) {
    const path = pathTemplate.replace("{locale}", locale)
    revalidatePath(path, "page")
  }
}

/**
 * Revalidate brand-related pages:
 * - Brands list page (/{locale}/brands)
 * - Brand detail page (/{locale}/brands/{slug}) if slug provided
 * - Homepage (/{locale}) since it may show brands
 */
export function revalidateBrandPages(brandSlug?: string | null) {
  console.log(`[revalidate] Brand pages${brandSlug ? ` (slug: ${brandSlug})` : ""}`)

  // Brands list page
  revalidateForAllLocales("/{locale}/brands")

  // Brand detail page
  if (brandSlug) {
    revalidateForAllLocales(`/{locale}/brands/${brandSlug}`)
  }

  // Homepage (shows brands)
  revalidateForAllLocales("/{locale}")
}

/**
 * Revalidate series-related pages:
 * - Series detail page (/{locale}/series/{slug}) if slug provided
 * - Parent brand page (/{locale}/brands/{brandSlug}) if brand slug provided
 */
export function revalidateSeriesPages(seriesSlug?: string | null, brandSlug?: string | null) {
  console.log(`[revalidate] Series pages${seriesSlug ? ` (slug: ${seriesSlug})` : ""}${brandSlug ? ` (brand: ${brandSlug})` : ""}`)

  // Series detail page
  if (seriesSlug) {
    revalidateForAllLocales(`/{locale}/series/${seriesSlug}`)
  }

  // Parent brand page (series are listed on brand page)
  if (brandSlug) {
    revalidateForAllLocales(`/{locale}/brands/${brandSlug}`)
  }
}

/**
 * Revalidate model-related pages:
 * - Model detail page (/{locale}/models/{slug}) if slug provided
 * - Parent series page (/{locale}/series/{seriesSlug}) if series slug provided
 * - Parent brand page (/{locale}/brands/{brandSlug}) if brand slug provided
 */
export function revalidateModelPages(
  modelSlug?: string | null,
  seriesSlug?: string | null,
  brandSlug?: string | null
) {
  console.log(`[revalidate] Model pages${modelSlug ? ` (slug: ${modelSlug})` : ""}`)

  // Model detail page
  if (modelSlug) {
    revalidateForAllLocales(`/{locale}/models/${modelSlug}`)
  }

  // Parent series page (models are listed on series page)
  if (seriesSlug) {
    revalidateForAllLocales(`/{locale}/series/${seriesSlug}`)
  }

  // Parent brand page (models without series are listed on brand page)
  if (brandSlug) {
    revalidateForAllLocales(`/{locale}/brands/${brandSlug}`)
  }
}

/**
 * Revalidate service-related pages:
 * - Services list / detail page (/{locale}/services/{slug}) if slug provided
 * - Homepage (/{locale}) since it may show services
 */
export function revalidateServicePages(serviceSlug?: string | null) {
  console.log(`[revalidate] Service pages${serviceSlug ? ` (slug: ${serviceSlug})` : ""}`)

  // Service detail page
  if (serviceSlug) {
    revalidateForAllLocales(`/{locale}/services/${serviceSlug}`)
  }

  // Homepage (may show services)
  revalidateForAllLocales("/{locale}")
}

/**
 * Revalidate model-service related pages:
 * - Model detail page (shows services for the model)
 * - Service + model combined page (/{locale}/services/{serviceSlug}/{modelSlug})
 */
export function revalidateModelServicePages(
  modelSlug?: string | null,
  serviceSlug?: string | null
) {
  console.log(`[revalidate] Model-service pages (model: ${modelSlug}, service: ${serviceSlug})`)

  // Model detail page (shows list of services)
  if (modelSlug) {
    revalidateForAllLocales(`/{locale}/models/${modelSlug}`)
  }

  // Service + model combined page
  if (serviceSlug && modelSlug) {
    revalidateForAllLocales(`/{locale}/services/${serviceSlug}/${modelSlug}`)
  }

  // Service detail page (may show price range)
  if (serviceSlug) {
    revalidateForAllLocales(`/{locale}/services/${serviceSlug}`)
  }
}
