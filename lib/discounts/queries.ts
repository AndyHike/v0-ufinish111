import { neon } from "@neondatabase/serverless"
import type { Discount, ApplicableDiscount } from "./types"

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }
  return neon(process.env.DATABASE_URL)
}

/**
 * Отримати всі активні знижки
 */
export async function getActiveDiscounts(): Promise<Discount[]> {
  const sql = getSql() // Отримуємо SQL клієнт під час виконання
  const result = await sql`
    SELECT 
      id,
      name,
      code,
      description,
      discount_type as "discountType",
      discount_value as "discountValue",
      service_ids as "serviceIds",
      scope_type as "scopeType",
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
  const sql = getSql() // Отримуємо SQL клієнт під час виконання

  const result = await sql`
    SELECT 
      d.id,
      d.name,
      d.code,
      d.description,
      d.discount_type as "discountType",
      d.discount_value as "discountValue",
      d.service_ids as "serviceIds",
      d.scope_type as "scopeType",
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
        WHEN d.scope_type = 'brand' THEN b.name
        WHEN d.scope_type = 'series' THEN ser.name
        WHEN d.scope_type = 'model' THEN m.name
        ELSE 'Всі моделі'
      END as "applicableTo"
    FROM discounts d
    LEFT JOIN brands b ON d.brand_id = b.id
    LEFT JOIN series ser ON d.series_id = ser.id
    LEFT JOIN models model_target ON d.model_id = model_target.id
    LEFT JOIN models m ON m.id = ${modelId}
    WHERE d.is_active = true
      AND (d.starts_at IS NULL OR d.starts_at <= NOW())
      AND (d.expires_at IS NULL OR d.expires_at > NOW())
      AND (d.max_uses IS NULL OR d.current_uses < d.max_uses)
      AND ${serviceId} = ANY(d.service_ids)
      AND (
        d.scope_type = 'all_models' OR
        (d.scope_type = 'model' AND d.model_id = ${modelId}) OR
        (d.scope_type = 'series' AND d.series_id = m.series_id) OR
        (d.scope_type = 'brand' AND d.brand_id = m.brand_id)
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
      serviceIds: row.serviceIds,
      scopeType: row.scopeType,
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
  const sql = getSql() // Отримуємо SQL клієнт під час виконання
  const result = await sql`
    SELECT 
      id,
      name,
      code,
      description,
      discount_type as "discountType",
      discount_value as "discountValue",
      service_ids as "serviceIds",
      scope_type as "scopeType",
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
  const sql = getSql()

  const serviceIdsArray = discount.serviceIds || []

  const result = await sql`
    INSERT INTO discounts (
      name, code, description,
      discount_type, discount_value,
      service_ids, scope_type, brand_id, series_id, model_id,
      is_active, starts_at, expires_at,
      max_uses, max_uses_per_user
    ) VALUES (
      ${discount.name},
      ${discount.code},
      ${discount.description || null},
      ${discount.discountType},
      ${discount.discountValue},
      ${serviceIdsArray}::uuid[],
      ${discount.scopeType},
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
      service_ids as "serviceIds",
      scope_type as "scopeType",
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
  const sql = getSql() // Отримуємо SQL клієнт під час виконання
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
      service_ids as "serviceIds",
      scope_type as "scopeType",
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
  const sql = getSql() // Отримуємо SQL клієнт під час виконання
  await sql`DELETE FROM discounts WHERE id = ${id}`
}
