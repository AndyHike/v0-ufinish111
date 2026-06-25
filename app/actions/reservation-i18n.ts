"use server"

import { createClient } from "@/lib/supabase"

// The reservation cart stores each line's service name as a plain string in the
// locale that was active when it was added (localStorage). When the visitor
// switches language on the cart page, those names would otherwise stay stale —
// so the cart re-fetches localized names by serviceId for the current locale.
export async function getLocalizedServiceNames(
  serviceIds: string[],
  locale: string,
): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(serviceIds.filter(Boolean)))
  if (uniqueIds.length === 0) return {}

  const supabase = createClient()
  const { data, error } = await supabase
    .from("services")
    .select("id, slug, services_translations(name, locale)")
    .in("id", uniqueIds)

  if (error) {
    console.error("Error fetching localized service names:", error)
    return {}
  }

  const map: Record<string, string> = {}
  for (const service of (data || []) as any[]) {
    const translations = (service.services_translations || []) as Array<{ name?: string; locale?: string }>
    const localized = translations.find((t) => t.locale === locale && t.name)
    const fallback = translations.find((t) => t.name)
    const name = localized?.name || fallback?.name
    if (name) map[service.id] = name
  }

  return map
}
