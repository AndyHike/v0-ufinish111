import { createClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format-currency"
import type { Discount } from "./types"

export type PersonalProfileOffer = {
  id: string
  code: string
  title: string
  description: string | null
  discountType: Discount["discountType"]
  discountValue: number
  discountValueLabel: string
  expiresAt: string | null
  remainingUses: number | null
  actionHref: string | null
  targetLabel: string | null
}

type DiscountOfferRow = {
  id: string
  name: string
  code: string
  description?: string | null
  discount_type: Discount["discountType"]
  discount_value: number | string
  service_ids?: string[] | string | null
  scope_type: Discount["scopeType"]
  model_id?: string | null
  is_active: boolean
  starts_at?: string | null
  expires_at?: string | null
  max_uses?: number | null
  current_uses?: number | null
  max_uses_per_user?: number | null
  user_id?: string | null
  show_as_offer?: boolean | null
  offer_title?: string | null
  offer_description?: string | null
  offer_priority?: number | null
}

function normalizeServiceIds(serviceIds: unknown): string[] {
  if (Array.isArray(serviceIds)) return serviceIds.map(String).filter(Boolean)
  if (typeof serviceIds === "string") return serviceIds.replace(/[{}]/g, "").split(",").filter(Boolean)
  return []
}

function pickLocalizedName(translations: unknown, locale: string) {
  const rows = Array.isArray(translations) ? translations : []
  const localized = rows.find((row: any) => row?.locale === locale && row?.name)
  const fallback = rows.find((row: any) => row?.name)
  return localized?.name || fallback?.name || null
}

async function getRemainingUses(discount: DiscountOfferRow, userId: string): Promise<number | null> {
  const globalRemaining =
    discount.max_uses && discount.max_uses > 0
      ? Math.max(0, discount.max_uses - (discount.current_uses || 0))
      : null

  const userRemaining =
    discount.max_uses_per_user && discount.max_uses_per_user > 0
      ? await getUserRemainingUses(discount.id, userId, discount.max_uses_per_user)
      : null

  if (globalRemaining === null && userRemaining === null) return null
  if (globalRemaining === null) return userRemaining
  if (userRemaining === null) return globalRemaining
  return Math.min(globalRemaining, userRemaining)
}

async function getUserRemainingUses(discountId: string, userId: string, maxUsesPerUser: number) {
  const supabase = createClient()
  const { count, error } = await supabase
    .from("discount_usages")
    .select("id", { count: "exact", head: true })
    .eq("discount_id", discountId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error reading personal offer usage:", error)
    return maxUsesPerUser
  }

  return Math.max(0, maxUsesPerUser - (count || 0))
}

function formatDiscountValue(row: DiscountOfferRow) {
  const value = Number(row.discount_value)
  if (row.discount_type === "percentage") return `${value}%`
  return formatCurrency(value)
}

async function resolveOfferTarget(row: DiscountOfferRow, locale: string) {
  const supabase = createClient()
  const serviceId = normalizeServiceIds(row.service_ids)[0]

  const servicePromise = serviceId
    ? supabase.from("services").select("id, slug, services_translations(name, locale)").eq("id", serviceId).maybeSingle()
    : Promise.resolve({ data: null as any, error: null as any })
  const modelPromise = row.model_id
    ? supabase.from("models").select("id, name, slug").eq("id", row.model_id).maybeSingle()
    : Promise.resolve({ data: null as any, error: null as any })

  const [serviceResult, modelResult] = await Promise.all([servicePromise, modelPromise])
  const service = serviceResult.data
  const model = modelResult.data
  const serviceSlug = service?.slug || null
  const modelSlug = model?.slug || null
  const serviceName = service ? pickLocalizedName(service.services_translations, locale) || service.slug : null
  const modelName = model?.name || null

  if (serviceSlug && modelSlug) {
    return {
      href: `/${locale}/services/${serviceSlug}/${modelSlug}`,
      label: [serviceName, modelName].filter(Boolean).join(" - ") || null,
    }
  }

  if (serviceSlug) {
    return {
      href: `/${locale}/services/${serviceSlug}`,
      label: serviceName,
    }
  }

  if (modelSlug) {
    return {
      href: `/${locale}/models/${modelSlug}`,
      label: modelName,
    }
  }

  return { href: `/${locale}/profile`, label: null }
}

async function mapOffer(row: DiscountOfferRow, userId: string, locale: string): Promise<PersonalProfileOffer | null> {
  const remainingUses = await getRemainingUses(row, userId)
  if (remainingUses !== null && remainingUses <= 0) return null

  const target = await resolveOfferTarget(row, locale)

  return {
    id: row.id,
    code: row.code,
    title: row.offer_title || row.name,
    description: row.offer_description || row.description || null,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    discountValueLabel: formatDiscountValue(row),
    expiresAt: row.expires_at || null,
    remainingUses,
    actionHref: target.href,
    targetLabel: target.label,
  }
}

export async function getPersonalProfileOffers({
  userId,
  locale,
  limit = 3,
}: {
  userId: string
  locale: string
  limit?: number
}): Promise<PersonalProfileOffer[]> {
  if (!userId) return []

  const supabase = createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("user_id", userId)
    .eq("show_as_offer", true)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("offer_priority", { ascending: false })
    .order("expires_at", { ascending: true })
    .limit(Math.max(limit * 3, limit))

  if (error) {
    console.error("Error fetching personal profile offers:", error)
    return []
  }

  const offers = await Promise.all(
    ((data || []) as DiscountOfferRow[]).map((row) => mapOffer(row, userId, locale)),
  )

  return offers.filter((offer): offer is PersonalProfileOffer => Boolean(offer)).slice(0, limit)
}
