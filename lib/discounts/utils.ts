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
  const roundedFinalPrice = roundDiscountedPrice(price, finalPrice)

  const actualDiscountPercentage = ((price - roundedFinalPrice) / price) * 100

  return {
    originalPrice: price,
    discountAmount,
    finalPrice,
    roundedFinalPrice,
    actualDiscountPercentage,
    discount,
  }
}

/**
 * Округлення ціни зі знижкою до цілого числа, що закінчується на 0 (100, 110, 150, 200, ...)
 * Ми завжди округлюємо вниз до найближчого десятка, щоб гарантувати, 
 * що ціна не перевищить математично розраховану знижку.
 */
export function roundDiscountedPrice(originalPrice: number, discountedPrice: number): number {
  if (discountedPrice <= 0) return 0

  // Округлюємо вниз до найближчого десятка (щоб кінцева цифра була 0)
  const rounded = Math.floor(discountedPrice / 10) * 10

  // Гарантуємо, що ціна не стала 0, якщо оригінальна ціна була значно вищою
  if (rounded === 0 && discountedPrice > 0) {
    return 10
  }

  return rounded
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
export function formatDiscountValue(discount: Discount, actualPercentage?: number): string {
  if (actualPercentage !== undefined) {
    return `${Math.round(actualPercentage)}%`
  }

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
