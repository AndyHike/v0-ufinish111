import type { Discount, DiscountCalculation } from "./types"

/**
 * Розрахунок знижки для ціни
 */
export function calculateDiscount(price: number, discount: Discount): DiscountCalculation {
  let discountAmount = 0

  if (discount.discountType === "percentage") {
    discountAmount = (price * discount.discountValue) / 100
  } else {
    discountAmount = discount.discountValue
  }

  const finalPrice = Math.max(0, price - discountAmount)
  const roundedFinalPrice = roundToNearest90(finalPrice)

  return {
    originalPrice: price,
    discountAmount,
    finalPrice,
    roundedFinalPrice,
    discount,
  }
}

/**
 * Округлення до найближчих 90 (90, 190, 290, 390, ...)
 */
export function roundToNearest90(price: number): number {
  if (price <= 0) return 0

  // Знаходимо найближче число, що закінчується на 90
  const rounded = Math.round(price / 100) * 100 - 10

  // Якщо округлене значення менше ціни, додаємо 100
  if (rounded < price) {
    return rounded + 100
  }

  return Math.max(90, rounded)
}

/**
 * Перевірка чи знижка активна
 */
export function isDiscountActive(discount: any): boolean {
  const isActive = discount.isActive ?? discount.is_active
  const startsAt = discount.startsAt ?? discount.starts_at
  const expiresAt = discount.expiresAt ?? discount.expires_at
  const maxUses = discount.maxUses ?? discount.max_uses
  const currentUses = discount.currentUses ?? discount.current_uses

  if (!isActive) return false

  const now = new Date()

  if (startsAt && new Date(startsAt) > now) {
    return false
  }

  if (expiresAt && new Date(expiresAt) < now) {
    return false
  }

  if (maxUses && currentUses >= maxUses) {
    return false
  }

  return true
}

/**
 * Форматування знижки для відображення
 */
export function formatDiscountValue(discount: Discount): string {
  if (discount.discountType === "percentage") {
    return `${discount.discountValue}%`
  }
  return `${discount.discountValue} Kč`
}

/**
 * Опис scope знижки
 */
export function getDiscountScopeDescription(discount: Discount): string {
  switch (discount.scopeType) {
    case "service":
      return "Знижка на конкретну послугу"
    case "brand":
      return "Знижка на всі послуги для бренду"
    case "series":
      return "Знижка на всі моделі серії"
    case "model":
      return "Знижка на конкретну модель"
    case "all_services":
      return "Знижка на всі послуги"
    case "all_models":
      return "Знижка на всі моделі"
    default:
      return "Знижка"
  }
}
