import { createServerClient } from "@/lib/supabase/server"
import type { Discount, DiscountCalculation } from "./types"
import { calculateDiscount, isDiscountActive } from "./utils"

/**
 * Отримує всі застосовні знижки для послуги на певній моделі
 */
export async function getApplicableDiscounts(serviceId: string, modelId: string): Promise<DiscountCalculation | null> {
  const supabase = await createServerClient()

  console.log("[v0] [DISCOUNT] Starting getApplicableDiscounts", { serviceId, modelId })

  const { data: model } = await supabase
    .from("models")
    .select("id, brand_id, series_id, name")
    .eq("id", modelId)
    .single()

  if (!model) {
    console.log("[v0] [DISCOUNT] Model not found")
    return null
  }

  console.log("[v0] [DISCOUNT] Model found:", model)

  const { data: discounts, error } = await supabase.from("discounts").select("*").eq("is_active", true)

  if (error) {
    console.error("[v0] [DISCOUNT] Error fetching discounts:", error)
    return null
  }

  console.log("[v0] [DISCOUNT] Raw discounts from DB:", JSON.stringify(discounts, null, 2))

  if (!discounts || discounts.length === 0) {
    console.log("[v0] [DISCOUNT] No discounts found in database")
    return null
  }

  const applicableDiscounts = discounts.filter((discount) => {
    console.log(`[v0] [DISCOUNT] Checking discount ${discount.id}:`, {
      name: discount.name,
      service_ids: discount.service_ids,
      service_ids_type: typeof discount.service_ids,
      service_ids_isArray: Array.isArray(discount.service_ids),
      looking_for_service: serviceId,
    })

    const isActive = isDiscountActive(discount as any)
    if (!isActive) {
      console.log(`[v0] [DISCOUNT] Discount ${discount.id} is not active`)
      return false
    }

    let serviceIds: string[] = []
    if (Array.isArray(discount.service_ids)) {
      serviceIds = discount.service_ids
    } else if (typeof discount.service_ids === "string") {
      // PostgreSQL може повертати як строку {uuid1,uuid2}
      serviceIds = discount.service_ids.replace(/[{}]/g, "").split(",")
    }

    console.log(`[v0] [DISCOUNT] Parsed service_ids:`, serviceIds)

    if (serviceIds.length === 0) {
      console.log(`[v0] [DISCOUNT] Discount ${discount.id} has no service_ids`)
      return false
    }

    if (!serviceIds.includes(serviceId)) {
      console.log(`[v0] [DISCOUNT] Service ${serviceId} not in discount ${discount.id} service_ids`)
      return false
    }

    console.log(`[v0] [DISCOUNT] Service ${serviceId} IS in discount ${discount.id} service_ids!`)

    if (discount.scope_type === "all_models") {
      console.log(`[v0] [DISCOUNT] Discount ${discount.id} applies to all models - MATCH!`)
      return true
    }
    if (discount.scope_type === "brand" && discount.brand_id === model.brand_id) {
      console.log(`[v0] [DISCOUNT] Discount ${discount.id} applies to brand ${model.brand_id} - MATCH!`)
      return true
    }
    if (discount.scope_type === "series" && discount.series_id === model.series_id) {
      console.log(`[v0] [DISCOUNT] Discount ${discount.id} applies to series ${model.series_id} - MATCH!`)
      return true
    }
    if (discount.scope_type === "model" && discount.model_id === modelId) {
      console.log(`[v0] [DISCOUNT] Discount ${discount.id} applies to model ${modelId} - MATCH!`)
      return true
    }

    console.log(`[v0] [DISCOUNT] Discount ${discount.id} scope mismatch:`, {
      scope_type: discount.scope_type,
      discount_brand_id: discount.brand_id,
      model_brand_id: model.brand_id,
      discount_series_id: discount.series_id,
      model_series_id: model.series_id,
      discount_model_id: discount.model_id,
      model_id: modelId,
    })
    return false
  })

  console.log(`[v0] [DISCOUNT] Applicable discounts found: ${applicableDiscounts.length}`)

  if (applicableDiscounts.length === 0) return null

  const selectedDiscount = applicableDiscounts[0]
  console.log(`[v0] [DISCOUNT] Selected discount:`, selectedDiscount)

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
