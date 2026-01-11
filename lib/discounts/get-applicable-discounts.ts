import { createServerClient } from "@/lib/supabase/server"
import type { Discount, DiscountCalculation } from "./types"
import { calculateDiscount, isDiscountActive } from "./utils"

/**
 * Отримує всі застосовні знижки для послуги на певній моделі
 */
export async function getApplicableDiscounts(serviceId: string, modelId: string): Promise<DiscountCalculation | null> {
  const supabase = await createServerClient()

  console.log("[v0] getApplicableDiscounts called:", { serviceId, modelId })

  const { data: model } = await supabase.from("models").select("id, brand_id, series_id").eq("id", modelId).single()

  if (!model) {
    console.log("[v0] Model not found:", modelId)
    return null
  }

  console.log("[v0] Model found:", { id: model.id, brand_id: model.brand_id, series_id: model.series_id })

  const { data: discounts, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("is_active", true)
    .contains("service_ids", [serviceId])
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)

  console.log("[v0] Discounts query result:", { discounts, error, serviceId })

  if (!discounts || discounts.length === 0) {
    console.log("[v0] No active discounts found for service:", serviceId)
    return null
  }

  console.log("[v0] Found", discounts.length, "potential discounts")

  const applicableDiscounts = discounts.filter((discount) => {
    const isActive = isDiscountActive(discount as any)
    console.log("[v0] Checking discount:", {
      id: discount.id,
      name: discount.name,
      isActive,
      scope_type: discount.scope_type,
      brand_id: discount.brand_id,
      series_id: discount.series_id,
      model_id: discount.model_id,
    })

    if (!isActive) return false

    // Перевіряємо scope
    if (discount.scope_type === "all_models") {
      console.log("[v0] Discount applies to all models")
      return true
    }
    if (discount.scope_type === "brand" && discount.brand_id === model.brand_id) {
      console.log("[v0] Discount applies to brand:", model.brand_id)
      return true
    }
    if (discount.scope_type === "series" && discount.series_id === model.series_id) {
      console.log("[v0] Discount applies to series:", model.series_id)
      return true
    }
    if (discount.scope_type === "model" && discount.model_id === modelId) {
      console.log("[v0] Discount applies to specific model:", modelId)
      return true
    }

    console.log("[v0] Discount does not apply to this model")
    return false
  })

  console.log("[v0] Applicable discounts count:", applicableDiscounts.length)

  if (applicableDiscounts.length === 0) return null

  console.log("[v0] Using first applicable discount:", applicableDiscounts[0])
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
