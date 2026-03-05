import { revalidatePath } from "next/cache"

const LOCALES = ["uk", "cs", "en"]

/**
 * Revalidate a specific URL path for all locales
 */
function revalidateForAllLocales(pathTemplate: string) {
  for (const locale of LOCALES) {
    const path = pathTemplate.replace("{locale}", locale)
    revalidatePath(path)
  }
}

/**
 * Revalidate brand-related pages.
 * Brands appear on: homepage, brand detail pages.
 * When brand changes, also revalidate all its series pages (they show brand name in breadcrumbs).
 */
export function revalidateBrandPages(brandSlug?: string | null) {
  // Homepage always shows brands list
  revalidateForAllLocales("/{locale}")

  // Brands listing page
  revalidateForAllLocales("/{locale}/brands")

  // Brand detail page
  if (brandSlug) {
    revalidateForAllLocales(`/{locale}/brands/${brandSlug}`)
  }
}

/**
 * Revalidate series-related pages.
 * Series appear on: brand detail page, series detail page.
 */
export function revalidateSeriesPages(seriesSlug?: string | null, brandSlug?: string | null) {
  // Series detail page
  if (seriesSlug) {
    revalidateForAllLocales(`/{locale}/series/${seriesSlug}`)
  }

  // Parent brand page (series are listed on brand page)
  if (brandSlug) {
    revalidateForAllLocales(`/{locale}/brands/${brandSlug}`)
  }

  // Homepage (in case series shown there)
  revalidateForAllLocales("/{locale}")
}

/**
 * Revalidate model-related pages.
 * Models appear on: series page, brand page, model detail page, service pages.
 */
export function revalidateModelPages(
  modelSlug?: string | null,
  seriesSlug?: string | null,
  brandSlug?: string | null
) {
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

  // Homepage
  revalidateForAllLocales("/{locale}")
}

/**
 * Revalidate service-related pages.
 * Services appear on: homepage, service detail page, service+model pages.
 */
export function revalidateServicePages(serviceSlug?: string | null) {
  // Service detail page
  if (serviceSlug) {
    revalidateForAllLocales(`/{locale}/services/${serviceSlug}`)
  }

  // Homepage
  revalidateForAllLocales("/{locale}")
}

/**
 * Revalidate model-service related pages.
 * Model-service bindings affect: model detail page, service detail page, service+model page.
 */
export function revalidateModelServicePages(
  modelSlug?: string | null,
  serviceSlug?: string | null
) {
  // Model detail page (shows list of services with prices)
  if (modelSlug) {
    revalidateForAllLocales(`/{locale}/models/${modelSlug}`)
  }

  // Service + model combined page
  if (serviceSlug && modelSlug) {
    revalidateForAllLocales(`/{locale}/services/${serviceSlug}/${modelSlug}`)
  }

  // Service detail page (may show price range or model list)
  if (serviceSlug) {
    revalidateForAllLocales(`/{locale}/services/${serviceSlug}`)
  }
}
