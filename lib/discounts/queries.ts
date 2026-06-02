import { createClient } from "@/lib/supabase/server"
import type { Discount, ApplicableDiscount } from "./types"

function mapDiscountRow(row: any): Discount {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    serviceIds: row.service_ids || [],
    scopeType: row.scope_type,
    brandId: row.brand_id,
    seriesId: row.series_id,
    modelId: row.model_id,
    isActive: row.is_active,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    currentUses: row.current_uses,
    maxUsesPerUser: row.max_uses_per_user,
    userId: row.user_id,
    requiresCode: row.requires_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Отримати всі знижки для адмін-панелі, включно з неактивними,
 * майбутніми та простроченими.
 */
export async function getAllDiscounts(): Promise<Discount[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("discounts").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching all discounts:", error)
    throw new Error("Failed to fetch discounts")
  }

  return (data || []).map(mapDiscountRow)
}

/**
 * Отримати всі активні знижки
 */
export async function getActiveDiscounts(): Promise<Discount[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching active discounts:", error)
    throw new Error("Failed to fetch active discounts")
  }

  return (data || []).map(mapDiscountRow)
}

/**
 * Знайти знижки для конкретної послуги та моделі
 */
export async function findApplicableDiscounts(serviceId: string, modelId: string): Promise<ApplicableDiscount[]> {
  const supabase = await createClient()

  // Спочатку отримаємо модель щоб знати brand_id та series_id
  const { data: model } = await supabase.from("models").select("brand_id, series_id, name").eq("id", modelId).single()

  if (!model) return []

  // Отримаємо всі активні знижки
  const { data: discounts, error } = await supabase
    .from("discounts")
    .select(`
      *,
      brands:brand_id(name),
      series:series_id(name),
      models:model_id(name)
    `)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .contains("service_ids", [serviceId])

  if (error) {
    console.error("Error finding applicable discounts:", error)
    return []
  }

  // Фільтруємо знижки по scope
  const applicable = (discounts || []).filter((d) => {
    if (d.scope_type === "all_models") return true
    if (d.scope_type === "model" && d.model_id === modelId) return true
    if (d.scope_type === "series" && d.series_id === model.series_id) return true
    if (d.scope_type === "brand" && d.brand_id === model.brand_id) return true
    return false
  })

  return applicable.map((row) => ({
    discount: mapDiscountRow(row),
    applicableTo:
      row.scope_type === "all_models"
        ? "Всі моделі"
        : row.scope_type === "brand" && row.brands
          ? row.brands.name
          : row.scope_type === "series" && row.series
            ? row.series.name
            : row.scope_type === "model" && row.models
              ? row.models.name
              : "N/A",
  }))
}

/**
 * Знайти знижку за кодом
 */
export async function findDiscountByCode(code: string): Promise<Discount | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("discounts").select("*").ilike("code", code).single()

  if (error || !data) return null

  return mapDiscountRow(data)
}

/**
 * Створити нову знижку
 */
export async function createDiscount(
  discount: Omit<Discount, "id" | "currentUses" | "createdAt" | "updatedAt">,
): Promise<Discount> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("discounts")
    .insert({
      name: discount.name,
      code: discount.code,
      description: discount.description || null,
      discount_type: discount.discountType,
      discount_value: discount.discountValue,
      service_ids: discount.serviceIds || [],
      scope_type: discount.scopeType,
      brand_id: discount.brandId || null,
      series_id: discount.seriesId || null,
      model_id: discount.modelId || null,
      is_active: discount.isActive,
      starts_at: discount.startsAt || null,
      expires_at: discount.expiresAt || null,
      max_uses: discount.maxUses || null,
      max_uses_per_user: discount.maxUsesPerUser || null,
      user_id: discount.userId || null,
      requires_code: discount.requiresCode || false,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating discount:", error)
    throw new Error(`Failed to create discount: ${error.message}`)
  }

  return mapDiscountRow(data)
}

/**
 * Оновити знижку
 */
export async function updateDiscount(id: string, updates: Partial<Discount>): Promise<Discount> {
  const supabase = await createClient()

  const updateData: any = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.code !== undefined) updateData.code = updates.code.toUpperCase()
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.discountType !== undefined) updateData.discount_type = updates.discountType
  if (updates.discountValue !== undefined) updateData.discount_value = updates.discountValue
  if (updates.serviceIds !== undefined) updateData.service_ids = updates.serviceIds || []
  if (updates.scopeType !== undefined) updateData.scope_type = updates.scopeType
  if (updates.brandId !== undefined) updateData.brand_id = updates.brandId || null
  if (updates.seriesId !== undefined) updateData.series_id = updates.seriesId || null
  if (updates.modelId !== undefined) updateData.model_id = updates.modelId || null
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive
  if (updates.startsAt !== undefined) updateData.starts_at = updates.startsAt || null
  if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt || null
  if (updates.maxUses !== undefined) updateData.max_uses = updates.maxUses || null
  if (updates.maxUsesPerUser !== undefined) updateData.max_uses_per_user = updates.maxUsesPerUser || null
  if (updates.userId !== undefined) updateData.user_id = updates.userId || null
  if (updates.requiresCode !== undefined) updateData.requires_code = updates.requiresCode

  const { data, error } = await supabase.from("discounts").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating discount:", error)
    throw new Error("Failed to update discount")
  }

  return mapDiscountRow(data)
}

/**
 * Видалити знижку
 */
export async function deleteDiscount(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("discounts").delete().eq("id", id)

  if (error) {
    console.error("Error deleting discount:", error)
    throw new Error("Failed to delete discount")
  }
}
