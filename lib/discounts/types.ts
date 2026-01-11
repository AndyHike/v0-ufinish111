export type DiscountType = "percentage" | "fixed"
export type DiscountScopeType = "service" | "brand" | "series" | "model" | "all_services" | "all_models"

export interface Discount {
  id: string
  name: string
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  scopeType: DiscountScopeType
  serviceId?: string
  brandId?: string
  seriesId?: string
  modelId?: string
  isActive: boolean
  startsAt?: Date
  expiresAt?: Date
  maxUses?: number
  currentUses: number
  maxUsesPerUser?: number
  createdAt: Date
  updatedAt: Date
}

export interface DiscountUsage {
  id: string
  discountId: string
  userId?: string
  orderId?: string
  usedAt: Date
  discountAmount: number
  originalPrice: number
  finalPrice: number
}

export interface DiscountCalculation {
  originalPrice: number
  discountAmount: number
  finalPrice: number
  roundedFinalPrice: number // округлено до найближчих 90
  discount: Discount
}

export interface ApplicableDiscount {
  discount: Discount
  applicableTo: string // назва сервісу/бренду/моделі
}
