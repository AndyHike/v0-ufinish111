import Link from "next/link"
import { Wrench } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { FEATURED_SERIES_SLUGS, featuredServiceName, getFeaturedServices } from "@/lib/seo/featured-repairs"

const COPY = {
  cs: { title: "Populární opravy", subtitle: "Nejčastější opravy s cenou rovnou — jedním klikem", from: "od" },
  uk: { title: "Популярні ремонти", subtitle: "Найчастіші ремонти з цінами — в один клік", from: "від" },
  en: { title: "Popular repairs", subtitle: "The most common repairs with prices — one click away", from: "from" },
} as const

const MODELS_PER_SERVICE = 6

/**
 * Direct links from the home page to the top service×model money pages
 * (featured services × top models). Home is the strongest page on the site and
 * previously linked no money page directly — this gives the converting leaves
 * depth 1 and an explicit "these matter" signal. Also UX: an iPhone owner
 * wants one click, not brand → series → model.
 */
export async function PopularRepairs({ locale }: { locale: string }) {
  const copy = COPY[locale as keyof typeof COPY] || COPY.cs

  const featured = await getFeaturedServices()
  if (featured.length === 0) return null

  const supabase = createClient()

  // Anchor series (iPhone) resolved once; models from them fill the block
  // first, in FEATURED_SERIES_SLUGS priority order.
  const { data: anchorSeries } = await supabase
    .from("series")
    .select("id, slug")
    .in("slug", [...FEATURED_SERIES_SLUGS])
  const seriesRank = new Map<string, number>()
  for (const s of anchorSeries || []) {
    const i = FEATURED_SERIES_SLUGS.indexOf(String(s.slug).toLowerCase() as (typeof FEATURED_SERIES_SLUGS)[number])
    if (i !== -1) seriesRank.set(s.id, i)
  }
  const rankOf = (seriesId: string | null) => (seriesId != null && seriesRank.has(seriesId) ? seriesRank.get(seriesId)! : FEATURED_SERIES_SLUGS.length)

  const groups = await Promise.all(
    featured.map(async (svc) => {
      const { data: rows } = await supabase
        .from("model_services")
        .select("price, models!inner(id, name, slug, position, series_id)")
        .eq("service_id", svc.id)

      const models = (rows || [])
        .map((r: any) => {
          const m = Array.isArray(r.models) ? r.models[0] : r.models
          return m && m.slug
            ? { id: m.id, name: m.name, slug: m.slug, position: m.position, series_id: m.series_id ?? null, price: r.price }
            : null
        })
        .filter((m): m is NonNullable<typeof m> => !!m)
        .sort(
          (a, b) =>
            rankOf(a.series_id) - rankOf(b.series_id) ||
            (a.position ?? 999) - (b.position ?? 999) ||
            a.name.localeCompare(b.name),
        )
        .slice(0, MODELS_PER_SERVICE)

      return { slug: svc.slug, name: featuredServiceName(svc, locale), models }
    }),
  )

  const visible = groups.filter((g) => g.models.length > 0)
  if (visible.length === 0) return null

  return (
    <section className="py-12 bg-white">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">{copy.title}</h2>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">{copy.subtitle}</p>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {visible.map((group) => (
            <div key={group.slug}>
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Wrench className="h-3.5 w-3.5" />
                {group.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.models.map((model) => (
                  <Link
                    key={model.id}
                    href={`/${locale}/services/${group.slug}/${model.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"
                  >
                    <span>
                      {group.name} {model.name}
                    </span>
                    {model.price != null && model.price > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {copy.from} {model.price} Kč
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
