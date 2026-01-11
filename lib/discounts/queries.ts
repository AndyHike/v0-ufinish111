import { neon } from "@neondatabase/serverless"
import type { Discount, ApplicableDiscount } from "./types"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Отримати всі активні знижки
 */
export async function getActiveDiscounts(): Promise<Discount[]> {
  const result = await sql`
    SELECT 
      id,
      name,
      code,
      description,
      discount_type as "discountType",
      discount_value as "discountValue",
      scope_type as "scopeType",
      service_id as "serviceId",
      brand_id as "brandId",
      series_id as "seriesId",
      model_id as "modelId",
      is_active as "isActive",
      starts_at as "startsAt",
      expires_at as "expiresAt",
      max_uses as "maxUses",
      current_uses as "currentUses",
      max_uses_per_user as "maxUsesPerUser",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM discounts
    WHERE is_active = true
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (max_uses IS NULL OR current_uses < max_uses)
    ORDER BY created_at DESC
  `

  return result as Discount[]
}

/**
 * Знайти знижки для конкретної послуги та моделі
 */
export async function findApplicableDiscounts(serviceId: string, modelId: string): Promise<ApplicableDiscount[]> {
  const result = await sql`
    SELECT 
      d.id,
      d.name,
      d.code,
      d.description,
      d.discount_type as "discountType",
      d.discount_value as "discountValue",
      d.scope_type as "scopeType",
      d.service_id as "serviceId",
      d.brand_id as "brandId",
      d.series_id as "seriesId",
      d.model_id as "modelId",
      d.is_active as "isActive",
      d.starts_at as "startsAt",
      d.expires_at as "expiresAt",
      d.max_uses as "maxUses",
      d.current_uses as "currentUses",
      d.max_uses_per_user as "maxUsesPerUser",
      d.created_at as "createdAt",
      d.updated_at as "updatedAt",
      CASE 
        WHEN d.scope_type = 'service' THEN s.name
        WHEN d.scope_type = 'brand' THEN b.name
        WHEN d.scope_type = 'series' THEN ser.name
        WHEN d.scope_type = 'model' THEN m.name
        ELSE d.name
      END as "applicableTo"
    FROM discounts d
    LEFT JOIN services s ON d.service_id = s.id
    LEFT JOIN brands b ON d.brand_id = b.id
    LEFT JOIN series ser ON d.series_id = ser.id
    LEFT JOIN models m ON d.model_id = m.id
    LEFT JOIN models target_model ON target_model.id = ${modelId}
    WHERE d.is_active = true
      AND (d.starts_at IS NULL OR d.starts_at <= NOW())
      AND (d.expires_at IS NULL OR d.expires_at > NOW())
      AND (d.max_uses IS NULL OR d.current_uses < d.max_uses)
      AND (
        d.scope_type = 'all_services' OR
        d.scope_type = 'all_models' OR
        (d.scope_type = 'service' AND d.service_id = ${serviceId}) OR
        (d.scope_type = 'model' AND d.model_id = ${modelId}) OR
        (d.scope_type = 'series' AND d.series_id = target_model.series_id) OR
        (d.scope_type = 'brand' AND d.brand_id = target_model.brand_id)
      )
    ORDER BY d.discount_value DESC
  `

  return result.map((row) => ({
    discount: {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      discountType: row.discountType,
      discountValue: row.discountValue,
      scopeType: row.scopeType,
      serviceId: row.serviceId,
      brandId: row.brandId,
      seriesId: row.seriesId,
      modelId: row.modelId,
      isActive: row.isActive,
      startsAt: row.startsAt,
      expiresAt: row.expiresAt,
      maxUses: row.maxUses,
      currentUses: row.currentUses,
      maxUsesPerUser: row.maxUsesPerUser,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    applicableTo: row.applicableTo,
  })) as ApplicableDiscount[]
}

/**
 * Знайти знижку за кодом
 */
export async function findDiscountByCode(code: string): Promise<Discount | null> {
  const result = await sql`
    SELECT 
      id,
      name,
      code,
      description,
      discount_type as "discountType",
      discount_value as "discountValue",
      scope_type as "scopeType",
      service_id as "serviceId",
      brand_id as "brandId",
      series_id as "seriesId",
      model_id as "modelId",
      is_active as "isActive",
      starts_at as "startsAt",
      expires_at as "expiresAt",
      max_uses as "maxUses",
      current_uses as "currentUses",
      max_uses_per_user as "maxUsesPerUser",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM discounts
    WHERE UPPER(code) = UPPER(${code})
    LIMIT 1
  `

  return (result[0] as Discount) || null
}

/**
 * Створити нову знижку
 */
export async function createDiscount(
  discount: Omit<Discount, "id" | "currentUses" | "createdAt" | "updatedAt">,
): Promise<Discount> {
  const result = await sql`
    INSERT INTO discounts (
      name, code, description,
      discount_type, discount_value,
      scope_type, service_id, brand_id, series_id, model_id,
      is_active, starts_at, expires_at,
      max_uses, max_uses_per_user
    ) VALUES (
      ${discount.name},
      ${discount.code},
      ${discount.description || null},
      ${discount.discountType},
      ${discount.discountValue},
      ${discount.scopeType},
      ${discount.serviceId || null},
      ${discount.brandId || null},
      ${discount.seriesId || null},
      ${discount.modelId || null},
      ${discount.isActive},
      ${discount.startsAt || null},
      ${discount.expiresAt || null},
      ${discount.maxUses || null},
      ${discount.maxUsesPerUser || null}
    )
    RETURNING 
      id,
      name,
      code,
      description,
      discount_type as "discountType",
      discount_value as "discountValue",
      scope_type as "scopeType",
      service_id as "serviceId",
      brand_id as "brandId",
      series_id as "seriesId",
      model_id as "modelId",
      is_active as "isActive",
      starts_at as "startsAt",
      expires_at as "expiresAt",
      max_uses as "maxUses",
      current_uses as "currentUses",
      max_uses_per_user as "maxUsesPerUser",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `

  return result[0] as Discount
}

/**
 * Оновити знижку
 */
export async function updateDiscount(id: string, updates: Partial<Discount>): Promise<Discount> {
  const result = await sql`
    UPDATE discounts
    SET
      name = COALESCE(${updates.name || null}, name),
      description = COALESCE(${updates.description || null}, description),
      discount_type = COALESCE(${updates.discountType || null}, discount_type),
      discount_value = COALESCE(${updates.discountValue || null}, discount_value),
      is_active = COALESCE(${updates.isActive ?? null}, is_active),
      expires_at = COALESCE(${updates.expiresAt || null}, expires_at),
      max_uses = COALESCE(${updates.maxUses || null}, max_uses)
    WHERE id = ${id}
    RETURNING 
      id,
      name,
      code,
      description,
      discount_type as "discountType",
      discount_value as "discountValue",
      scope_type as "scopeType",
      service_id as "serviceId",
      brand_id as "brandId",
      series_id as "seriesId",
      model_id as "modelId",
      is_active as "isActive",
      starts_at as "startsAt",
      expires_at as "expiresAt",
      max_uses as "maxUses",
      current_uses as "currentUses",
      max_uses_per_user as "maxUsesPerUser",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `

  return result[0] as Discount
}

/**
 * Видалити знижку
 */
export async function deleteDiscount(id: string): Promise<void> {
  await sql`DELETE FROM discounts WHERE id = ${id}`
}
