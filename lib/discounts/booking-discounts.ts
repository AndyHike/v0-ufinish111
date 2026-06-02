import { createClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format-currency"
import type { Discount, DiscountCalculation } from "./types"
import { calculateDiscount, isDiscountActive } from "./utils"

export type BookingDiscountChoice =
  | { type: "none" }
  | { type: "personal"; discountId: string }
  | { type: "code"; code: string }

export type BookingDiscountSource = "automatic" | "personal" | "code" | "role"

export type BookingDiscountSelectionErrorCode =
  | "model_not_found"
  | "personal_discount_unavailable"
  | "discount_code_empty"
  | "discount_code_not_found"
  | "discount_code_not_applicable"
  | "discount_code_wrong_account"
  | "discount_code_limit_reached"

export type BookingDiscountTarget = {
  id: string
  slug: string | null
  name: string | null
}

export type BookingDiscountErrorContext = {
  code: string
  discountName: string | null
  scopeType: Discount["scopeType"]
  appliesToCurrentModel: boolean
  services: BookingDiscountTarget[]
  brand: BookingDiscountTarget | null
  series: BookingDiscountTarget | null
  model: BookingDiscountTarget | null
}

export type BookingDiscountView = {
  id: string
  name: string
  code: string
  source: BookingDiscountSource
  discountType: Discount["discountType"]
  discountValue: number
  discountedPrice: number
  actualDiscountPercentage: number
  remainingUses: number | null
}

export type BookingDiscountSummary = {
  originalPrice: number
  basePrice: number
  finalPrice: number
  formattedFinalPrice: string
  hasDiscount: boolean
  baseDiscount: BookingDiscountView | null
  appliedDiscount: BookingDiscountView | null
  personalDiscounts: BookingDiscountView[]
  codeDiscount: BookingDiscountView | null
  usageDiscountId: string | null
  selectionError: string | null
  selectionErrorCode: BookingDiscountSelectionErrorCode | null
  selectionErrorContext: BookingDiscountErrorContext | null
}

type ModelContext = {
  id: string
  brand_id: string | null
  series_id: string | null
  slug?: string | null
  name?: string | null
}

type DiscountCandidate = {
  source: BookingDiscountSource
  discount: Discount
  calculation: DiscountCalculation
  remainingUses: number | null
}

type DiscountRow = {
  id: string
  name: string
  code: string
  description?: string | null
  discount_type: "percentage" | "fixed"
  discount_value: number | string
  service_ids?: string[] | string | null
  service_id?: string | null
  scope_type: Discount["scopeType"]
  brand_id?: string | null
  series_id?: string | null
  model_id?: string | null
  is_active: boolean
  starts_at?: string | null
  expires_at?: string | null
  max_uses?: number | null
  current_uses?: number | null
  max_uses_per_user?: number | null
  user_id?: string | null
  requires_code?: boolean | null
  created_at?: string
  updated_at?: string
}

function normalizeServiceIds(serviceIds: unknown): string[] {
  if (Array.isArray(serviceIds)) return serviceIds.map(String)
  if (typeof serviceIds === "string") return serviceIds.replace(/[{}]/g, "").split(",").filter(Boolean)
  return []
}

function getDiscountServiceIds(discount: Pick<DiscountRow, "service_ids" | "service_id">): string[] {
  const serviceIds = normalizeServiceIds(discount.service_ids)
  if (discount.service_id) serviceIds.push(String(discount.service_id))
  return Array.from(new Set(serviceIds))
}

function pickLocalizedName(translations: unknown, locale?: string) {
  const rows = Array.isArray(translations) ? translations : []
  const localized = rows.find((row: any) => row?.locale === locale && row?.name)
  const fallback = rows.find((row: any) => row?.name)
  return localized?.name || fallback?.name || null
}

function toTarget(row: any, locale?: string): BookingDiscountTarget | null {
  if (!row?.id) return null

  return {
    id: String(row.id),
    slug: row.slug || null,
    name: row.name || pickLocalizedName(row.services_translations, locale) || row.slug || null,
  }
}

function discountMatchesModelScope(discount: DiscountRow, model: ModelContext) {
  if (discount.scope_type === "service") return true
  if (discount.scope_type === "all_services") return true
  if (discount.scope_type === "all_models") return true
  if (discount.scope_type === "brand") return Boolean(discount.brand_id && discount.brand_id === model.brand_id)
  if (discount.scope_type === "series") return Boolean(discount.series_id && discount.series_id === model.series_id)
  if (discount.scope_type === "model") return Boolean(discount.model_id && discount.model_id === model.id)
  return false
}

function mapDiscountRow(row: DiscountRow): Discount {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description || undefined,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    serviceIds: getDiscountServiceIds(row),
    scopeType: row.scope_type,
    brandId: row.brand_id || undefined,
    seriesId: row.series_id || undefined,
    modelId: row.model_id || undefined,
    isActive: row.is_active,
    startsAt: row.starts_at as any,
    expiresAt: row.expires_at as any,
    maxUses: row.max_uses || undefined,
    currentUses: row.current_uses || 0,
    maxUsesPerUser: row.max_uses_per_user || undefined,
    userId: row.user_id || undefined,
    requiresCode: Boolean(row.requires_code),
    createdAt: (row.created_at || new Date().toISOString()) as any,
    updatedAt: (row.updated_at || new Date().toISOString()) as any,
  }
}

function discountMatchesScope(discount: DiscountRow, model: ModelContext, serviceId: string) {
  const serviceIds = getDiscountServiceIds(discount)
  if (serviceIds.length > 0 && !serviceIds.includes(serviceId)) {
    return false
  }

  return discountMatchesModelScope(discount, model)
}

async function getUserUsageCount(discountId: string, userId?: string) {
  if (!userId) return 0

  const supabase = createClient()
  const { count, error } = await supabase
    .from("discount_usages")
    .select("id", { count: "exact", head: true })
    .eq("discount_id", discountId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error reading discount usage:", error)
    return 0
  }

  return count || 0
}

async function getRemainingUses(discount: DiscountRow, userId?: string): Promise<number | null> {
  const globalRemaining =
    discount.max_uses && discount.max_uses > 0
      ? Math.max(0, discount.max_uses - (discount.current_uses || 0))
      : null

  const userUsage = await getUserUsageCount(discount.id, userId)
  const userRemaining =
    discount.max_uses_per_user && discount.max_uses_per_user > 0 && userId
      ? Math.max(0, discount.max_uses_per_user - userUsage)
      : null

  if (globalRemaining === null && userRemaining === null) return null
  if (globalRemaining === null) return userRemaining
  if (userRemaining === null) return globalRemaining
  return Math.min(globalRemaining, userRemaining)
}

async function canUseDiscount(discount: DiscountRow, userId?: string) {
  if (!isDiscountActive(discount)) return false

  const remainingUses = await getRemainingUses(discount, userId)
  return remainingUses === null || remainingUses > 0
}

async function buildCandidate(
  discount: DiscountRow,
  source: BookingDiscountSource,
  originalPrice: number,
  userId?: string,
): Promise<DiscountCandidate | null> {
  if (!(await canUseDiscount(discount, userId))) {
    return null
  }

  const mapped = mapDiscountRow(discount)
  const calculation = calculateDiscount(originalPrice, mapped)

  return {
    source,
    discount: mapped,
    calculation,
    remainingUses: await getRemainingUses(discount, userId),
  }
}

function toView(candidate: DiscountCandidate): BookingDiscountView {
  return {
    id: candidate.discount.id,
    name: candidate.discount.name,
    code: candidate.discount.code,
    source: candidate.source,
    discountType: candidate.discount.discountType,
    discountValue: candidate.discount.discountValue,
    discountedPrice: candidate.calculation.roundedFinalPrice,
    actualDiscountPercentage: candidate.calculation.actualDiscountPercentage,
    remainingUses: candidate.remainingUses,
  }
}

function bestCandidate(candidates: Array<DiscountCandidate | null | undefined>) {
  return candidates
    .filter((candidate): candidate is DiscountCandidate => Boolean(candidate))
    .sort((a, b) => a.calculation.roundedFinalPrice - b.calculation.roundedFinalPrice)[0]
}

async function getRoleCandidate(serviceId: string, originalPrice: number, userId?: string): Promise<DiscountCandidate | null> {
  if (!userId) return null

  const supabase = createClient()
  const { data: userData } = await supabase.from("users").select("role_id").eq("id", userId).maybeSingle()
  if (!userData?.role_id) return null

  const { data: roleData } = await supabase
    .from("roles")
    .select("discount_percentage")
    .eq("id", userData.role_id)
    .maybeSingle()

  const roleDiscountPercentage = Number(roleData?.discount_percentage || 0)
  if (!roleDiscountPercentage) return null

  const discount: Discount = {
    id: "role-based",
    name: "Role discount",
    code: "ROLE_DISCOUNT",
    description: "Role-based customer discount",
    discountType: "percentage",
    discountValue: roleDiscountPercentage,
    serviceIds: [serviceId],
    scopeType: "service",
    isActive: true,
    currentUses: 0,
    requiresCode: false,
    createdAt: new Date().toISOString() as any,
    updatedAt: new Date().toISOString() as any,
  }

  return {
    source: "role",
    discount,
    calculation: calculateDiscount(originalPrice, discount),
    remainingUses: null,
  }
}

async function buildDiscountErrorContext(
  discount: DiscountRow,
  model: ModelContext,
  locale?: string,
): Promise<BookingDiscountErrorContext> {
  const supabase = createClient()
  const serviceIds = getDiscountServiceIds(discount)

  const servicesPromise = serviceIds.length
    ? supabase.from("services").select("id, slug, services_translations(name, locale)").in("id", serviceIds)
    : Promise.resolve({ data: [] as any[] })
  const brandPromise = discount.brand_id
    ? supabase.from("brands").select("id, name, slug").eq("id", discount.brand_id).maybeSingle()
    : Promise.resolve({ data: null as any })
  const seriesPromise = discount.series_id
    ? supabase.from("series").select("id, name, slug").eq("id", discount.series_id).maybeSingle()
    : Promise.resolve({ data: null as any })
  const modelPromise = discount.model_id
    ? supabase.from("models").select("id, name, slug").eq("id", discount.model_id).maybeSingle()
    : Promise.resolve({ data: null as any })

  const [servicesResult, brandResult, seriesResult, modelResult] = await Promise.all([
    servicesPromise,
    brandPromise,
    seriesPromise,
    modelPromise,
  ])

  return {
    code: discount.code,
    discountName: discount.name || null,
    scopeType: discount.scope_type,
    appliesToCurrentModel: discountMatchesModelScope(discount, model),
    services: ((servicesResult.data || []) as any[]).map((service) => toTarget(service, locale)).filter(Boolean) as BookingDiscountTarget[],
    brand: toTarget(brandResult.data, locale),
    series: toTarget(seriesResult.data, locale),
    model: toTarget(modelResult.data, locale),
  }
}

async function getDiscountData(serviceId: string, modelId: string) {
  const supabase = createClient()
  const { data: model } = await supabase.from("models").select("id, brand_id, series_id, slug, name").eq("id", modelId).maybeSingle()

  if (!model) {
    return { model: null, discounts: [] as DiscountRow[], allDiscounts: [] as DiscountRow[] }
  }

  const { data: discounts, error } = await supabase.from("discounts").select("*").eq("is_active", true)

  if (error) {
    console.error("Error fetching booking discounts:", error)
    return { model, discounts: [] as DiscountRow[], allDiscounts: [] as DiscountRow[] }
  }

  const allDiscounts = (discounts || []) as DiscountRow[]

  return {
    model,
    discounts: allDiscounts.filter((discount) => discountMatchesScope(discount, model, serviceId)),
    allDiscounts,
  }
}

async function getCodeCandidate(
  discounts: DiscountRow[],
  allDiscounts: DiscountRow[],
  code: string,
  originalPrice: number,
  model: ModelContext,
  userId?: string,
  locale?: string,
): Promise<{
  candidate: DiscountCandidate | null
  error: string | null
  errorCode: BookingDiscountSelectionErrorCode | null
  errorContext: BookingDiscountErrorContext | null
}> {
  const normalizedCode = code.trim().toUpperCase()
  if (!normalizedCode) {
    return { candidate: null, error: "Discount code is empty", errorCode: "discount_code_empty", errorContext: null }
  }

  const discount = discounts.find((item) => item.code?.toUpperCase() === normalizedCode)
  if (!discount) {
    const knownDiscount = allDiscounts.find((item) => item.code?.toUpperCase() === normalizedCode)
    if (!knownDiscount) {
      return {
        candidate: null,
        error: "Discount code was not found",
        errorCode: "discount_code_not_found",
        errorContext: null,
      }
    }

    if (knownDiscount.user_id && knownDiscount.user_id !== userId) {
      return {
        candidate: null,
        error: "Discount code is not available for this account",
        errorCode: "discount_code_wrong_account",
        errorContext: null,
      }
    }

    return {
      candidate: null,
      error: "Discount code is not valid for this service",
      errorCode: "discount_code_not_applicable",
      errorContext: await buildDiscountErrorContext(knownDiscount, model, locale),
    }
  }

  if (discount.user_id && discount.user_id !== userId) {
    return {
      candidate: null,
      error: "Discount code is not available for this account",
      errorCode: "discount_code_wrong_account",
      errorContext: null,
    }
  }

  const candidate = await buildCandidate(discount, "code", originalPrice, userId)
  if (!candidate) {
    return {
      candidate: null,
      error: "Discount code usage limit has been reached",
      errorCode: "discount_code_limit_reached",
      errorContext: null,
    }
  }

  return { candidate, error: null, errorCode: null, errorContext: null }
}

export async function resolveBookingDiscount(params: {
  serviceId: string
  modelId: string
  originalPrice: number
  userId?: string
  locale?: string
  discountChoice?: BookingDiscountChoice
}): Promise<BookingDiscountSummary> {
  const { serviceId, modelId, originalPrice, userId, locale, discountChoice = { type: "none" } } = params
  const { model, discounts, allDiscounts } = await getDiscountData(serviceId, modelId)

  if (!model || !Number.isFinite(originalPrice) || originalPrice <= 0) {
    return {
      originalPrice,
      basePrice: originalPrice,
      finalPrice: originalPrice,
      formattedFinalPrice: formatCurrency(originalPrice),
      hasDiscount: false,
      baseDiscount: null,
      appliedDiscount: null,
      personalDiscounts: [],
      codeDiscount: null,
      usageDiscountId: null,
      selectionError: model ? null : "Model was not found",
      selectionErrorCode: model ? null : "model_not_found",
      selectionErrorContext: null,
    }
  }

  const automaticCandidates = await Promise.all(
    discounts
      .filter((discount) => !discount.requires_code && !discount.user_id)
      .map((discount) => buildCandidate(discount, "automatic", originalPrice, userId)),
  )
  automaticCandidates.push(await getRoleCandidate(serviceId, originalPrice, userId))

  const personalCandidates = userId
    ? await Promise.all(
        discounts
          .filter((discount) => !discount.requires_code && discount.user_id === userId)
          .map((discount) => buildCandidate(discount, "personal", originalPrice, userId)),
      )
    : []

  const baseCandidate = bestCandidate(automaticCandidates)
  const personalDiscounts = personalCandidates
    .filter((candidate): candidate is DiscountCandidate => Boolean(candidate))
    .sort((a, b) => a.calculation.roundedFinalPrice - b.calculation.roundedFinalPrice)

  let selectedOptionalCandidate: DiscountCandidate | null = null
  let codeDiscount: BookingDiscountView | null = null
  let selectionError: string | null = null
  let selectionErrorCode: BookingDiscountSelectionErrorCode | null = null
  let selectionErrorContext: BookingDiscountErrorContext | null = null

  if (discountChoice.type === "personal") {
    selectedOptionalCandidate = personalDiscounts.find((candidate) => candidate.discount.id === discountChoice.discountId) || null
    if (!selectedOptionalCandidate) {
      selectionError = "Personal discount is no longer available"
      selectionErrorCode = "personal_discount_unavailable"
    }
  }

  if (discountChoice.type === "code") {
    const codeResult = await getCodeCandidate(discounts, allDiscounts, discountChoice.code, originalPrice, model, userId, locale)
    selectedOptionalCandidate = codeResult.candidate
    selectionError = codeResult.error
    selectionErrorCode = codeResult.errorCode
    selectionErrorContext = codeResult.errorContext
    codeDiscount = codeResult.candidate ? toView(codeResult.candidate) : null
  }

  const finalCandidate = bestCandidate([baseCandidate, selectedOptionalCandidate])
  const basePrice = baseCandidate ? baseCandidate.calculation.roundedFinalPrice : originalPrice
  const finalPrice = finalCandidate ? finalCandidate.calculation.roundedFinalPrice : originalPrice
  const appliedDiscount = finalCandidate && finalPrice < originalPrice ? toView(finalCandidate) : null
  const usageDiscountId = appliedDiscount && appliedDiscount.source !== "role" ? appliedDiscount.id : null

  return {
    originalPrice,
    basePrice,
    finalPrice,
    formattedFinalPrice: formatCurrency(finalPrice),
    hasDiscount: finalPrice < originalPrice,
    baseDiscount: baseCandidate ? toView(baseCandidate) : null,
    appliedDiscount,
    personalDiscounts: personalDiscounts.map(toView),
    codeDiscount,
    usageDiscountId,
    selectionError,
    selectionErrorCode,
    selectionErrorContext,
  }
}

export async function recordDiscountUsage(params: {
  discountId: string | null
  userId?: string
  originalPrice: number
  finalPrice: number
}) {
  const { discountId, userId, originalPrice, finalPrice } = params
  if (!discountId || finalPrice >= originalPrice) {
    return { recorded: false, reason: "No table discount was applied" }
  }

  const supabase = createClient()
  const { data: discount, error } = await supabase
    .from("discounts")
    .select("id, current_uses, max_uses, max_uses_per_user")
    .eq("id", discountId)
    .maybeSingle()

  if (error || !discount) {
    throw new Error("Applied discount was not found")
  }

  if (discount.max_uses && discount.current_uses >= discount.max_uses) {
    throw new Error("Applied discount usage limit has been reached")
  }

  if (discount.max_uses_per_user && userId) {
    const userUsageCount = await getUserUsageCount(discountId, userId)
    if (userUsageCount >= discount.max_uses_per_user) {
      throw new Error("Applied discount per-user usage limit has been reached")
    }
  }

  const { error: insertError } = await supabase.from("discount_usages").insert({
    discount_id: discountId,
    user_id: userId || null,
    order_id: null,
    discount_amount: Math.max(0, originalPrice - finalPrice),
    original_price: originalPrice,
    final_price: finalPrice,
  })

  if (insertError) {
    throw new Error(`Failed to record discount usage: ${insertError.message}`)
  }

  const { error: updateError } = await supabase
    .from("discounts")
    .update({ current_uses: (discount.current_uses || 0) + 1 })
    .eq("id", discountId)

  if (updateError) {
    throw new Error(`Failed to update discount usage counter: ${updateError.message}`)
  }

  return { recorded: true }
}
