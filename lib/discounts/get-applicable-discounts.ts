import { createServerClient } from "@/lib/supabase/server"
import type { Discount, DiscountCalculation } from "./types"
import { calculateDiscount, isDiscountActive } from "./utils"

/**
 * Отримує всі застосовні знижки для послуги на певній моделі
 */
export async function getApplicableDiscounts(serviceId: string, modelId: string): Promise<DiscountCalculation | null> {
  const supabase = await createServerClient()

  const { data: model } = await supabase.from("models").select("id, brand_id, series_id").eq("id", modelId).single()

  if (!model) {
    return null
  }

  const { data: discounts, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("is_active", true)
    .contains("service_ids", [serviceId])
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

  if (!discounts || discounts.length === 0) {
    return null
  }

  const applicableDiscounts = discounts.filter((discount) => {
    const isActive = isDiscountActive(discount as any)

    if (!isActive) return false

    // Перевіряємо scope
    if (discount.scope_type === "all_models") {
      return true
    }
    if (discount.scope_type === "brand" && discount.brand_id === model.brand_id) {
      return true
    }
    if (discount.scope_type === "series" && discount.series_id === model.series_id) {
      return true
    }
    if (discount.scope_type === "model" && discount.model_id === modelId) {
      return true
    }

    return false
  })

  if (applicableDiscounts.length === 0) return null

  return applicableDiscounts[0] as any
}

/**
 * Розраховує ціну зі знижкою для послуги
 */
export async function getPriceWithDiscount(
  serviceId: string,
  modelId: string,
  originalPrice: number,
): Promise<{ originalPrice: number; discountedPrice: number; hasDiscount: boolean; discount?: Discount }> {
  const discount = await getApplicableDiscounts(serviceId, modelId)

  if (!discount) {
    return {
      originalPrice,
      discountedPrice: originalPrice,
      hasDiscount: false,
    }
  }

  const calculation = calculateDiscount(originalPrice, discount as any)

  return {
    originalPrice,
    discountedPrice: calculation.roundedFinalPrice,
    hasDiscount: true,
    discount: discount as any,
  }
}
