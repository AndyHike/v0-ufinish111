"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search, Smartphone } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

type HubModel = {
  id: string
  name: string
  slug: string
  image_url: string | null
  price: number | null
}

export type HubGroup = {
  name: string | null
  slug: string | null
  models: HubModel[]
}

type Labels = {
  chooseModel: string
  otherModels: string
  from: string
  allSeries: string
  searchPlaceholder: string
  noResults: string
}

export function BrandHubModels({
  groups,
  locale,
  slug,
  labels,
}: {
  groups: HubGroup[]
  locale: string
  slug: string
  labels: Labels
}) {
  const [query, setQuery] = useState("")
  // null = all series; otherwise the selected group key (series slug, or "" for ungrouped)
  const [activeSeries, setActiveSeries] = useState<string | null>(null)

  // Preselect a series when arriving from a series-page service card (#series-<slug>).
  useEffect(() => {
    const match = window.location.hash.match(/^#series-(.+)$/)
    if (!match) return
    const target = decodeURIComponent(match[1])
    if (!groups.some((g) => (g.slug || "") === target)) return
    setActiveSeries(target)
    // Undo any browser anchor-jump (older builds set a matching element id) so
    // the user lands at the top of the hub — hero + filtered list — not mid-page.
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const q = query.trim().toLowerCase()

  const filteredGroups = useMemo(() => {
    return groups
      .filter((g) => activeSeries === null || (g.slug || "") === activeSeries)
      .map((g) => ({
        ...g,
        models: q ? g.models.filter((m) => m.name.toLowerCase().includes(q)) : g.models,
      }))
      .filter((g) => g.models.length > 0)
  }, [groups, activeSeries, q])

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-slate-200 bg-white text-muted-foreground hover:border-primary hover:text-primary"
    }`

  return (
    <div>
      <h2 className="mb-6 border-b pb-2 text-2xl font-bold">{labels.chooseModel}</h2>

      {/* Quick search + series filter */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {groups.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveSeries(null)} className={chip(activeSeries === null)}>
              {labels.allSeries}
            </button>
            {groups.map((g, i) => {
              const key = g.slug || ""
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => setActiveSeries(activeSeries === key ? null : key)}
                  className={chip(activeSeries === key)}
                >
                  {g.name || labels.otherModels}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {filteredGroups.length > 0 ? (
        <div className="space-y-10">
          {filteredGroups.map((group, gi) => (
            // No element `id` here on purpose: the series-page links carry a
            // `#series-<slug>` hash that we read in JS to preselect the filter.
            // If we also set a matching id, the browser would jump-scroll to it
            // on load (past the hero). Reading the hash in the effect is enough.
            <div key={gi}>
              {/* Show the series sub-header only in the multi-series "all" view;
                  redundant when filtered to one, or on a single-series hub. */}
              {activeSeries === null && groups.length > 1 && (
                <h3 className="mb-4 text-lg font-semibold text-muted-foreground">
                  {group.name || labels.otherModels}
                </h3>
              )}
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {group.models.map((model) => (
                  <Link
                    key={model.id}
                    href={`/${locale}/services/${slug}/${model.slug}`}
                    className="group flex flex-col items-center rounded-lg bg-white p-4 shadow-sm hover:shadow"
                  >
                    <div
                      className={`relative mb-4 flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-28 sm:w-28 ${
                        model.image_url ? "" : "bg-slate-50 p-2"
                      }`}
                    >
                      {model.image_url ? (
                        // Source images are already small CDN webp; skip the
                        // /_next/image optimizer and load directly (instant, no
                        // re-encode) — matches the service/model-detail pages.
                        <img
                          src={model.image_url}
                          alt={model.name}
                          width={112}
                          height={112}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <Smartphone className="h-8 w-8 text-slate-400" />
                      )}
                    </div>
                    <h4 className="text-center text-base font-medium group-hover:text-primary sm:text-lg">
                      {model.name}
                    </h4>
                    {model.price != null && model.price > 0 && (
                      <span className="mt-1 text-sm text-muted-foreground">
                        {labels.from} {formatCurrency(model.price)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">{labels.noResults}</p>
      )}
    </div>
  )
}
