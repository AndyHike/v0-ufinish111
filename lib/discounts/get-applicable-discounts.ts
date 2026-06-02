import { createClient } from "@/utils/supabase/client"
import type { Discount } from "./types"
import { calculateDiscount, isDiscountActive } from "./utils"

type ModelContext = {
  id: string
  brand_id: string | null
  series_id: string | null
  name?: string | null
}

function normalizeServiceIds(serviceIds: unknown): string[] {
  if (Array.isArray(serviceIds)) return serviceIds.map(String)
  if (typeof serviceIds === "string") return serviceIds.replace(/[{}]/g, "").split(",").filter(Boolean)
  return []
}

function mapDiscountRow(row: any): Discount {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    serviceIds: normalizeServiceIds(row.service_ids),
    scopeType: row.scope_type,
    brandId: row.brand_id,
    seriesId: row.series_id,
    modelId: row.model_id,
    isActive: row.is_active,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    currentUses: row.current_uses || 0,
    maxUsesPerUser: row.max_uses_per_user,
    userId: row.user_id,
    requiresCode: row.requires_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function discountMatchesContext(discount: any, model: ModelContext, serviceId: string, userId?: string) {
  if (!isDiscountActive(discount)) {
    return false
  }

  if (discount.requires_code) {
    return false
  }

  if (discount.user_id && discount.user_id !== userId) {
    return false
  }

  const serviceIds = normalizeServiceIds(discount.service_ids)
  if (serviceIds.length === 0 || !serviceIds.includes(serviceId)) {
    return false
  }

  if (discount.scope_type === "all_models") return true
  if (discount.scope_type === "brand" && discount.brand_id === model.brand_id) return true
  if (discount.scope_type === "series" && discount.series_id === model.series_id) return true
  if (discount.scope_type === "model" && discount.model_id === model.id) return true

  return false
}

async function getApplicableDiscountRows(serviceId: string, modelId: string, userId?: string): Promise<any[]> {
  const supabase = createClient()

  const { data: model } = await supabase.from("models").select("id, brand_id, series_id, name").eq("id", modelId).single()

  if (!model) {
    return []
  }

  const { data: discounts, error } = await supabase.from("discounts").select("*").eq("is_active", true)

  if (error || !discounts || discounts.length === 0) {
    return []
  }

  return discounts.filter((discount) => discountMatchesContext(discount, model, serviceId, userId))
}

/**
 * Returns the first active, non-code-only discount for legacy callers.
 * Price-facing code should use getPriceWithDiscount, which selects the best final price.
 */
export async function getApplicableDiscounts(serviceId: string, modelId: string, userId?: string): Promise<any> {
  const applicableDiscounts = await getApplicableDiscountRows(serviceId, modelId, userId)
  return applicableDiscounts[0] || null
}

export async function getPriceWithDiscount(
  serviceId: string,
  modelId: string,
  originalPrice: number,
  userId?: string,
): Promise<{
  originalPrice: number
  discountedPrice: number
  hasDiscount: boolean
  discount?: Discount
  actualDiscountPercentage?: number
  discountSource?: "service" | "role"
}> {
  const supabase = createClient()
  const applicableDiscounts = await getApplicableDiscountRows(serviceId, modelId, userId)

  let bestServiceDiscount: Discount | null = null
  let bestServiceDiscountedPrice = originalPrice
  let bestServiceDiscountPercentage = 0

  for (const discountRow of applicableDiscounts) {
    const candidate = mapDiscountRow(discountRow)
    const calculation = calculateDiscount(originalPrice, candidate)
    const candidatePrice = calculation.roundedFinalPrice

    if (candidatePrice < bestServiceDiscountedPrice) {
      bestServiceDiscount = candidate
      bestServiceDiscountedPrice = candidatePrice
      bestServiceDiscountPercentage = calculation.actualDiscountPercentage
    }
  }

  let roleDiscountPercentage = 0
  if (userId) {
    const { data: userData } = await supabase.from("users").select("role_id").eq("id", userId).single()

    if (userData?.role_id) {
      const { data: roleData } = await supabase
        .from("roles")
        .select("discount_percentage")
        .eq("id", userData.role_id)
        .single()

      if (roleData?.discount_percentage) {
        roleDiscountPercentage = Number(roleData.discount_percentage)
      }
    }
  }

  if (roleDiscountPercentage > 0) {
    const roleDiscountObj: Discount = {
      id: "role-based",
      name: "Спеціальна знижка",
      code: "ROLE_DISCOUNT",
      discountType: "percentage",
      discountValue: roleDiscountPercentage,
      description: "Персональна знижка клієнта",
      serviceIds: [serviceId],
      scopeType: "service",
      brandId: null,
      seriesId: null,
      modelId: null,
      userId,
      requiresCode: false,
      isActive: true,
      maxUses: null,
      currentUses: 0,
      maxUsesPerUser: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any

    const roleCalculation = calculateDiscount(originalPrice, roleDiscountObj)

    if (roleCalculation.roundedFinalPrice < bestServiceDiscountedPrice) {
      return {
        originalPrice,
        discountedPrice: roleCalculation.roundedFinalPrice,
        hasDiscount: true,
        actualDiscountPercentage: roleCalculation.actualDiscountPercentage,
        discount: roleDiscountObj,
        discountSource: "role",
      }
    }
  }

  if (bestServiceDiscount) {
    return {
      originalPrice,
      discountedPrice: bestServiceDiscountedPrice,
      hasDiscount: true,
      discount: bestServiceDiscount,
      actualDiscountPercentage: bestServiceDiscountPercentage,
      discountSource: "service",
    }
  }

  return {
    originalPrice,
    discountedPrice: originalPrice,
    hasDiscount: false,
  }
}
