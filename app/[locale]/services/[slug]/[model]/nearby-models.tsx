import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

const COPY = {
  cs: { title: (svc: string, scope: string) => `${svc} — další modely ${scope}`, from: "od" },
  uk: { title: (svc: string, scope: string) => `${svc} — інші моделі ${scope}`, from: "від" },
  en: { title: (svc: string, scope: string) => `${svc} — other ${scope} models`, from: "from" },
} as const

type Sibling = {
  id: string
  name: string
  slug: string
  position: number | null
  price: number | null
}

/**
 * "Same service for neighboring models" block on the service×model money page.
 * Links the ~12 closest-by-position models of the same series (falling back to
 * the same brand for series-less models) that offer this service, turning each
 * service into a connected sideways cluster instead of isolated leaves.
 */
export async function NearbyModelLinks({
  serviceId,
  serviceSlug,
  serviceName,
  locale,
  modelId,
  modelPosition,
  seriesId,
  brandId,
  scopeName,
}: {
  serviceId: string
  serviceSlug: string
  serviceName: string
  locale: string
  modelId: string
  modelPosition: number | null
  seriesId: string | null
  brandId: string | null
  scopeName: string
}) {
  if (!seriesId && !brandId) return null

  const supabase = createClient()
  let query = supabase
    .from("model_services")
    .select("price, models!inner(id, name, slug, position, series_id, brand_id)")
    .eq("service_id", serviceId)
  query = seriesId ? query.eq("models.series_id", seriesId) : query.eq("models.brand_id", brandId!)

  const { data: rows } = await query

  const siblings: Sibling[] = (rows || [])
    .map((r: any) => {
      const m = Array.isArray(r.models) ? r.models[0] : r.models
      return m && m.slug ? { id: m.id, name: m.name, slug: m.slug, position: m.position, price: r.price } : null
    })
    .filter((m): m is Sibling => !!m && m.id !== modelId)

  if (siblings.length === 0) return null

  // Nearest 12 by catalog position around the current model; ties broken by
  // position then name so the selection is deterministic.
  const pos = modelPosition ?? 999
  const nearest = [...siblings]
    .sort(
      (a, b) =>
        Math.abs((a.position ?? 999) - pos) - Math.abs((b.position ?? 999) - pos) ||
        (a.position ?? 999) - (b.position ?? 999) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 12)
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999) || a.name.localeCompare(b.name))

  const copy = COPY[locale as keyof typeof COPY] || COPY.cs

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {copy.title(serviceName, scopeName)}
      </h2>
      <div className="flex flex-wrap gap-2">
        {nearest.map((m) => (
          <Link
            key={m.id}
            href={`/${locale}/services/${serviceSlug}/${m.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600"
          >
            <span>{m.name}</span>
            {m.price != null && m.price > 0 && (
              <span className="text-xs text-muted-foreground">
                {copy.from} {m.price} Kč
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
