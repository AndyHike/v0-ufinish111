import { revalidatePath } from "next/cache"

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
    }
}
