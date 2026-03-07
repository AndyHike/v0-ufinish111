import { createClient } from "@/utils/supabase/client"
import type { Discount, DiscountCalculation } from "./types"
import { calculateDiscount, isDiscountActive } from "./utils"

/**
 * Отримує всі застосовні знижки для послуги на певній моделі
 */
export async function getApplicableDiscounts(serviceId: string, modelId: string): Promise<any> {
  const supabase = createClient()

  const { data: model } = await supabase
    .from("models")
    .select("id, brand_id, series_id, name")
    .eq("id", modelId)
    .single()

  if (!model) {
    return null
  }

  const { data: discounts, error } = await supabase.from("discounts").select("*").eq("is_active", true)

  if (error || !discounts || discounts.length === 0) {
    return null
  }

  const applicableDiscounts = discounts.filter((discount) => {
    const isActive = isDiscountActive(discount as any)
    if (!isActive) {
      return false
    }

    let serviceIds: string[] = []
    if (Array.isArray(discount.service_ids)) {
      serviceIds = discount.service_ids
    } else if (typeof discount.service_ids === "string") {
      serviceIds = discount.service_ids.replace(/[{}]/g, "").split(",")
    }

    if (serviceIds.length === 0 || !serviceIds.includes(serviceId)) {
      return false
    }

    if (discount.scope_type === "all_models") return true
    if (discount.scope_type === "brand" && discount.brand_id === model.brand_id) return true
    if (discount.scope_type === "series" && discount.series_id === model.series_id) return true
    if (discount.scope_type === "model" && discount.model_id === modelId) return true

    return false
  })

  if (applicableDiscounts.length === 0) return null

  return applicableDiscounts[0] as any
}

/**
 * Розраховує ціну зі знижкою для послуги
 * Враховує як знижку сервісу, так і знижку ролі користувача (застосовується більша)
 */
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
  const discount = await getApplicableDiscounts(serviceId, modelId)

  // Get role-based discount if userId is provided
  let roleDiscountPercentage = 0
  if (userId) {
    const { data: userData } = await supabase
      .from("users")
      .select("role_id")
      .eq("id", userId)
      .single()

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

  // Calculate service-level discount
  let serviceDiscountPercentage = 0
  let serviceDiscountedPrice = originalPrice
  let discountForCalc: Discount | null = null

  if (discount) {
    discountForCalc = {
      id: discount.id,
      name: discount.name,
      code: discount.code,
      description: discount.description,
      discountType: discount.discount_type,
      discountValue: discount.discount_value,
      serviceIds: discount.service_ids,
      scopeType: discount.scope_type,
      brandId: discount.brand_id,
      seriesId: discount.series_id,
      modelId: discount.model_id,
      isActive: discount.is_active,
      startsAt: discount.starts_at,
      expiresAt: discount.expires_at,
      maxUses: discount.max_uses,
      currentUses: discount.current_uses,
      maxUsesPerUser: discount.max_uses_per_user,
      createdAt: discount.created_at,
      updatedAt: discount.updated_at,
    }

    const calculation = calculateDiscount(originalPrice, discountForCalc)
    serviceDiscountPercentage = calculation.actualDiscountPercentage
    serviceDiscountedPrice = calculation.roundedFinalPrice
  }

  // Apply the better discount (higher percentage = better for customer)
  if (roleDiscountPercentage > 0 && roleDiscountPercentage > serviceDiscountPercentage) {
    // Role discount is better
    const roleDiscountedPrice = Math.round(originalPrice * (1 - roleDiscountPercentage / 100))
    return {
      originalPrice,
      discountedPrice: roleDiscountedPrice,
      hasDiscount: true,
      actualDiscountPercentage: roleDiscountPercentage,
      discountSource: "role",
    }
  }

  if (discountForCalc) {
    // Service discount is better (or equal)
    return {
      originalPrice,
      discountedPrice: serviceDiscountedPrice,
      hasDiscount: true,
      discount: discountForCalc,
      actualDiscountPercentage: serviceDiscountPercentage,
      discountSource: "service",
    }
  }

  // No discounts at all
  return {
    originalPrice,
    discountedPrice: originalPrice,
    hasDiscount: false,
  }
}
