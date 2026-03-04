import { revalidatePath } from "next/cache"

const LOCALES = ["uk", "cs", "en"]

/**
 * Revalidate a specific URL path for all locales.
 * Uses revalidatePath(path) WITHOUT "page" type — for concrete URL paths.
 * (The "page" type is only for filesystem route patterns like /[locale]/models/[slug])
 */
function revalidateForAllLocales(pathTemplate: string) {
  for (const locale of LOCALES) {
    const path = pathTemplate.replace("{locale}", locale)
    revalidatePath(path)
  }
}

/**
 * Revalidate brand-related pages:
 * - Homepage (shows brands)
 * - Brand detail page if slug provided
 */
export function revalidateBrandPages(brandSlug?: string | null) {
  console.log(`[revalidate] Brand pages${brandSlug ? ` (slug: ${brandSlug})` : ""}`)

  // Homepage (shows brands)
  revalidateForAllLocales("/{locale}")

  // Brand detail page
  if (brandSlug) {
    revalidateForAllLocales(`/{locale}/brands/${brandSlug}`)
  }
}

/**
 * Revalidate series-related pages:
 * - Series detail page if slug provided
 * - Parent brand page if brand slug provided
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
 * - Model detail page if slug provided
 * - Parent series page if series slug provided
 * - Parent brand page if brand slug provided
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

  // Parent brand page
  if (brandSlug) {
    revalidateForAllLocales(`/{locale}/brands/${brandSlug}`)
  }
}

/**
 * Revalidate service-related pages:
 * - Service detail page if slug provided
 * - Homepage (may show services)
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
 * - Service + model combined page
 * - Service detail page
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
