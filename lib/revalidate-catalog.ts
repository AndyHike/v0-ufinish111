import { revalidatePath, revalidateTag } from "next/cache"

// Локалі основного сайту (тримати синхронно з i18n.ts / middleware.ts)
const LOCALES = ["uk", "cs", "en"] as const

type Ids = Iterable<string | null | undefined> | undefined

function clean(ids: Ids): string[] {
  return Array.from(new Set([...(ids || [])].filter((x): x is string => !!x)))
}

/**
 * Скидає кеш каталогу основного сайту після імпорту.
 *
 * - Сторінка моделі (`/[locale]/models/[slug]`) та сторінка кінцевої послуги
 *   (`/[locale]/services/[slug]/[model]`) кешують дані `model_services` через
 *   `unstable_cache` з тегом `model-services-<modelId>` — тому для них достатньо
 *   `revalidateTag`.
 * - Сторінки бренду/серії/послуги та списки використовують лише ISR за часом,
 *   тому їх скидаємо через `revalidatePath`.
 *
 * Помилки тут не повинні зривати імпорт — викликати у try/catch.
 *
 * @param opts.modelIds      моделі, чиї послуги (ціни/перелік) змінились — тег + похідні бренд/серія
 * @param opts.serviceIds    базові послуги, чиї сторінки треба оновити
 * @param opts.brandIds      бренди, чиї сторінки треба оновити
 * @param opts.seriesIds     серії, чиї сторінки треба оновити
 * @param opts.modelDetail   також скинути шлях сторінки моделі (коли змінились самі дані моделі)
 */
export async function revalidateCatalog(
  supabase: any,
  opts: {
    modelIds?: Ids
    serviceIds?: Ids
    brandIds?: Ids
    seriesIds?: Ids
    modelDetail?: boolean
  } = {},
): Promise<void> {
  const modelIds = clean(opts.modelIds)
  const serviceIds = clean(opts.serviceIds)
  const brandIds = new Set(clean(opts.brandIds))
  const seriesIds = new Set(clean(opts.seriesIds))

  // 1) Теги: оновлюють сторінку моделі + сторінку кінцевої послуги (дані model_services)
  for (const id of modelIds) {
    revalidateTag(`model-services-${id}`)
  }

  // 2) Дістаємо slug-и для скидання конкретних шляхів
  const modelSlugs: string[] = []
  if (modelIds.length) {
    const { data } = await supabase.from("models").select("slug, brand_id, series_id").in("id", modelIds)
    for (const m of data || []) {
      if (m.slug) modelSlugs.push(m.slug)
      if (m.brand_id) brandIds.add(m.brand_id)
      if (m.series_id) seriesIds.add(m.series_id)
    }
  }

  const serviceSlugs: string[] = []
  if (serviceIds.length) {
    const { data } = await supabase.from("services").select("slug").in("id", serviceIds)
    for (const s of data || []) if (s.slug) serviceSlugs.push(s.slug)
  }

  const brandSlugs: string[] = []
  if (brandIds.size) {
    const { data } = await supabase.from("brands").select("slug").in("id", [...brandIds])
    for (const b of data || []) if (b.slug) brandSlugs.push(b.slug)
  }

  const seriesSlugs: string[] = []
  if (seriesIds.size) {
    const { data } = await supabase.from("series").select("slug").in("id", [...seriesIds])
    for (const s of data || []) if (s.slug) seriesSlugs.push(s.slug)
  }

  // 3) Скидаємо шляхи для кожної локалі
  for (const locale of LOCALES) {
    if (opts.modelDetail) {
      for (const slug of modelSlugs) revalidatePath(`/${locale}/models/${slug}`, "page")
    }
    for (const slug of serviceSlugs) revalidatePath(`/${locale}/services/${slug}`, "page")
    for (const slug of brandSlugs) revalidatePath(`/${locale}/brands/${slug}`, "page")
    for (const slug of seriesSlugs) revalidatePath(`/${locale}/series/${slug}`, "page")

    // Списки + головна (нові елементи мають з'явитися у переліках)
    revalidatePath(`/${locale}/models`, "page")
    revalidatePath(`/${locale}/series`, "page")
    revalidatePath(`/${locale}/brands`, "page")
    revalidatePath(`/${locale}`, "page")
  }
}
