import { revalidatePath, revalidateTag } from "next/cache"

const locales = ["uk", "en", "cs"]

/**
 * Revalidates cache for specific frontend paths exactly, preventing global purges
 */
export const revalidateUtils = {
    /**
     * Clears the main brands list and optionally a specific brand page
     */
    revalidateBrand: (brandSlug?: string) => {
        locales.forEach((locale) => {
            revalidatePath(`/${locale}/brands`, "page")
            if (brandSlug) {
                revalidatePath(`/${locale}/brands/${brandSlug}`, "page")
                // Також оновлюємо сторінку серій бренду
                revalidatePath(`/${locale}/brands/${brandSlug}/series`, "page")
            }
        })
        console.log(`[Cache] Revalidated Brand paths for slug: ${brandSlug || 'none (list only)'}`)
    },

    /**
     * Clears a specific series page and its parent brand series list
     */
    revalidateSeries: (brandSlug: string, seriesSlug?: string) => {
        locales.forEach((locale) => {
            // Батьківська сторінка списку серій цього бренду
            revalidatePath(`/${locale}/brands/${brandSlug}/series`, "page")

            if (seriesSlug) {
                // Окрема сторінка серії
                revalidatePath(`/${locale}/series/${seriesSlug}`, "page")
                // Також шлях через бренд-серію
                revalidatePath(`/${locale}/brands/${brandSlug}/series/${seriesSlug}`, "page")
            }
        })
        console.log(`[Cache] Revalidated Series paths for: Brand ${brandSlug}, Series ${seriesSlug || 'none'}`)
    },

    /**
     * Clears a specific model page and its parent series/brand pages
     */
    revalidateModel: (brandSlug: string, seriesSlug: string | null, modelSlug?: string) => {
        locales.forEach((locale) => {
            // Оновлюємо батьківські сторінки
            if (seriesSlug) {
                revalidatePath(`/${locale}/series/${seriesSlug}`, "page")
                revalidatePath(`/${locale}/brands/${brandSlug}/series/${seriesSlug}`, "page")
            } else {
                revalidatePath(`/${locale}/brands/${brandSlug}/series`, "page")
            }

            // Якщо передано slug моделі - оновлюємо саму модель
            if (modelSlug) {
                revalidatePath(`/${locale}/models/${modelSlug}`, "page")
            }
        })
        console.log(`[Cache] Revalidated Model paths for: Brand ${brandSlug}, Series ${seriesSlug || 'none'}, Model ${modelSlug || 'none'}`)
    },

    /**
     * Clears model page + all service/model combination pages when model services are changed.
     * Uses revalidateTag for cache entries wrapped in unstable_cache, plus revalidatePath as fallback.
     */
    revalidateModelServices: (modelSlug: string, serviceSlug?: string, modelId?: string) => {
        // Tag-based invalidation — скидає всі запити, закешовані з цим тегом
        revalidateTag(`model-${modelSlug}`)
        revalidateTag(`model-services`)
        if (modelId) {
            revalidateTag(`model-services-${modelId}`)
        }

        // Path-based fallback — на випадок сторінок без unstable_cache
        locales.forEach((locale) => {
            revalidatePath(`/${locale}/models/${modelSlug}`, "page")
            if (serviceSlug) {
                revalidatePath(`/${locale}/services/${serviceSlug}/${modelSlug}`, "page")
            }
        })
        console.log(`[Cache] Revalidated ModelServices tags+paths for: Model ${modelSlug}, Service ${serviceSlug || 'all'}, ModelId ${modelId || 'unknown'}`)
    }
}
