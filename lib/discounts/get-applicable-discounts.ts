import { createServerClient } from "@/lib/supabase/server"
import type { Discount, DiscountCalculation } from "./types"
import { calculateDiscount, isDiscountActive } from "./utils"

/**
 * Отримує всі застосовні знижки для послуги на певній моделі
 */
export async function getApplicableDiscounts(serviceId: string, modelId: string): Promise<DiscountCalculation | null> {
  const supabase = await createServerClient()

  console.log("[DISCOUNT] Starting getApplicableDiscounts", { serviceId, modelId })

  const { data: model } = await supabase
    .from("models")
    .select("id, brand_id, series_id, name")
    .eq("id", modelId)
    .single()

  if (!model) {
    console.log("[DISCOUNT] Model not found")
    return null
  }

  console.log("[DISCOUNT] Model found:", model)

  const { data: discounts, error } = await supabase.from("discounts").select("*").eq("is_active", true)

  if (error) {
    console.error("[DISCOUNT] Error fetching discounts:", error)
    return null
  }

  console.log("[DISCOUNT] Found discounts:", discounts?.length || 0)

  if (!discounts || discounts.length === 0) {
    console.log("[DISCOUNT] No discounts found in database")
    return null
  }

  const applicableDiscounts = discounts.filter((discount) => {
    // Перевіряємо чи знижка активна
    const isActive = isDiscountActive(discount as any)
    console.log(`[DISCOUNT] Checking discount ${discount.id} (${discount.name}):`, {
      isActive,
      serviceIds: discount.service_ids,
      includesService: discount.service_ids?.includes(serviceId),
      scopeType: discount.scope_type,
      brandMatch: discount.brand_id === model.brand_id,
      seriesMatch: discount.series_id === model.series_id,
      modelMatch: discount.model_id === modelId,
    })

    if (!isActive) return false

    // Перевіряємо чи послуга включена в знижку
    if (!discount.service_ids || !Array.isArray(discount.service_ids) || discount.service_ids.length === 0) {
      console.log(`[DISCOUNT] Discount ${discount.id} has no service_ids`)
      return false
    }

    if (!discount.service_ids.includes(serviceId)) {
      console.log(`[DISCOUNT] Service ${serviceId} not in discount ${discount.id} service_ids`)
      return false
    }

    // Перевіряємо scope
    if (discount.scope_type === "all_models") {
      console.log(`[DISCOUNT] Discount ${discount.id} applies to all models - MATCH`)
      return true
    }
    if (discount.scope_type === "brand" && discount.brand_id === model.brand_id) {
      console.log(`[DISCOUNT] Discount ${discount.id} applies to brand ${model.brand_id} - MATCH`)
      return true
    }
    if (discount.scope_type === "series" && discount.series_id === model.series_id) {
      console.log(`[DISCOUNT] Discount ${discount.id} applies to series ${model.series_id} - MATCH`)
      return true
    }
    if (discount.scope_type === "model" && discount.model_id === modelId) {
      console.log(`[DISCOUNT] Discount ${discount.id} applies to model ${modelId} - MATCH`)
      return true
    }

    console.log(`[DISCOUNT] Discount ${discount.id} does not match scope`)
    return false
  })

  console.log(`[DISCOUNT] Applicable discounts found: ${applicableDiscounts.length}`)

  if (applicableDiscounts.length === 0) return null

  // Повертаємо першу застосовну знижку
  const selectedDiscount = applicableDiscounts[0]
  console.log(`[DISCOUNT] Selected discount:`, selectedDiscount)

  return selectedDiscount as any
}

/**
 * Розраховує ціну зі знижкою для послуги
 */
export async function getPriceWithDiscount(
  serviceId: string,
  modelId: string,
  originalPrice: number,
): Promise<{ originalPrice: number; discountedPrice: number; hasDiscount: boolean; discount?: Discount }> {
  console.log("[DISCOUNT] getPriceWithDiscount called", { serviceId, modelId, originalPrice })

  const discount = await getApplicableDiscounts(serviceId, modelId)

  if (!discount) {
    console.log("[DISCOUNT] No applicable discount found")
    return {
      originalPrice,
      discountedPrice: originalPrice,
      hasDiscount: false,
    }
  }

  console.log("[DISCOUNT] Calculating discount for price:", originalPrice)
  const calculation = calculateDiscount(originalPrice, discount as any)
  console.log("[DISCOUNT] Calculation result:", calculation)

  return {
    originalPrice,
    discountedPrice: calculation.roundedFinalPrice,
    hasDiscount: true,
    discount: discount as any,
  }
}
