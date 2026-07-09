import "server-only"
import { unstable_cache } from "next/cache"
import { createClient } from "@/utils/supabase/client"

/**
 * The "money" services featured in the home popular-repairs block and the
 * footer hub links. Explicit slugs (like the footer's old hardcoded brands):
 * top-by-position would pick both display variants and the thin glass-only
 * service. Missing slugs self-heal — the list is refilled by position with a
 * minimum-coverage threshold.
 */
export const FEATURED_SERVICE_SLUGS = ["screen-replacement", "battery-replacement"] as const
const FEATURED_COUNT = 2
const MIN_PAIRS_FOR_FALLBACK = 50

/**
 * Series the home popular-repairs block anchors on, in priority order. Most
 * profit comes from iPhones (owner's call) — and catalog `position` can't
 * express that: it is a render-order value set once when a model is added.
 * Models from these series fill the block first (newest first via in-series
 * position); only a shortfall is topped up from the rest of the catalog.
 */
export const FEATURED_SERIES_SLUGS = ["iphone"] as const

export type FeaturedService = {
  id: string
  slug: string
  position: number
  /** locale -> translated name */
  names: Record<string, string>
}

export type FooterHubLink = { href: string; label: string }

async function loadFeaturedServices(): Promise<FeaturedService[]> {
  const supabase = createClient()
  const { data: services } = await supabase
    .from("services")
    .select("id, slug, position, services_translations(name, locale), model_services(id)")
    .order("position", { ascending: true })

  const rows = (services || [])
    .filter((s: any) => typeof s.slug === "string" && s.slug.trim() !== "")
    .map((s: any) => ({
      id: s.id as string,
      slug: s.slug as string,
      position: (s.position ?? 999) as number,
      pairCount: ((s.model_services as any[]) || []).length,
      names: Object.fromEntries(((s.services_translations as any[]) || []).map((t: any) => [t.locale, t.name])) as Record<
        string,
        string
      >,
    }))

  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const picked: typeof rows = []
  for (const slug of FEATURED_SERVICE_SLUGS) {
    const svc = bySlug.get(slug)
    if (svc && svc.pairCount > 0) picked.push(svc)
  }
  for (const svc of rows) {
    if (picked.length >= FEATURED_COUNT) break
    if (!picked.includes(svc) && svc.pairCount >= MIN_PAIRS_FOR_FALLBACK) picked.push(svc)
  }

  return picked.slice(0, FEATURED_COUNT).map(({ id, slug, position, names }) => ({ id, slug, position, names }))
}

export const getFeaturedServices = unstable_cache(loadFeaturedServices, ["featured-repair-services"], {
  revalidate: 3600,
  tags: ["featured-repairs"],
})

export function featuredServiceName(service: FeaturedService, locale: string): string {
  return service.names[locale] || service.names.cs || service.names.en || service.slug
}

/**
 * Sitewide footer links into the top brand×service hubs (replaces the old
 * hardcoded /brands/{apple,samsung,xiaomi} links — brands are already depth 1
 * via the home page, so the sitewide weight goes to commercial hubs instead).
 * Only (service, brand) combos that actually have offers are linked — the hub
 * page 404s otherwise.
 */
async function loadFooterHubLinks(locale: string): Promise<FooterHubLink[]> {
  try {
    const featured = await getFeaturedServices()
    if (featured.length === 0) return []

    const supabase = createClient()
    const { data: brands } = await supabase
      .from("brands")
      .select("id, name, slug, position")
      .not("slug", "is", null)
      .order("position", { ascending: true })
    if (!brands || brands.length === 0) return []

    const { data: pairRows } = await supabase
      .from("model_services")
      .select("service_id, models!inner(brand_id)")
      .in(
        "service_id",
        featured.map((s) => s.id),
      )

    const combos = new Set(
      (pairRows || [])
        .map((r: any) => {
          const model = Array.isArray(r.models) ? r.models[0] : r.models
          return model?.brand_id ? `${r.service_id}|${model.brand_id}` : null
        })
        .filter(Boolean),
    )

    const links: FooterHubLink[] = []
    for (const svc of featured) {
      for (const brand of brands) {
        if (!combos.has(`${svc.id}|${brand.id}`)) continue
        links.push({
          href: `/${locale}/services/${svc.slug}/brand/${String(brand.slug).toLowerCase()}`,
          label: `${featuredServiceName(svc, locale)} ${brand.name}`,
        })
      }
    }
    return links.slice(0, 6)
  } catch (error) {
    console.warn("[footer-hub-links] failed, footer falls back to brand links:", error)
    return []
  }
}

export const getFooterHubLinks = unstable_cache(loadFooterHubLinks, ["footer-hub-links"], {
  revalidate: 3600,
  tags: ["featured-repairs"],
})
