import { formatCurrency } from "@/lib/format-currency"
import { Badge } from "@/components/ui/badge"
import { formatDiscountValue } from "@/lib/discounts/utils"
import type { Discount } from "@/lib/discounts/types"

interface ServicePriceDisplayProps {
  originalPrice: number
  discountedPrice?: number
  hasDiscount?: boolean
  discount?: Discount
  actualDiscountPercentage?: number
  size?: "sm" | "md" | "lg"
  showBadge?: boolean
}

export function ServicePriceDisplay({
  originalPrice,
  discountedPrice,
  hasDiscount = false,
  discount,
  actualDiscountPercentage,
  size = "md",
  showBadge = true,
}: ServicePriceDisplayProps) {
  const sizeClasses = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl lg:text-3xl",
  }

  const oldPriceSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  if (!hasDiscount || !discountedPrice) {
    return (
      <div className={`font-bold text-gray-900 ${sizeClasses[size]}`} suppressHydrationWarning>
        {formatCurrency(originalPrice)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1" suppressHydrationWarning>
      <div className="flex items-center gap-2 flex-wrap">
        <div className={`font-bold text-gray-900 ${sizeClasses[size]}`}>{formatCurrency(discountedPrice)}</div>
        {showBadge && discount && (
          <Badge variant="destructive" className="text-xs">
            -{formatDiscountValue(discount, actualDiscountPercentage)}
          </Badge>
        )}
      </div>
      <div className={`text-gray-500 line-through ${oldPriceSizeClasses[size]}`}>{formatCurrency(originalPrice)}</div>
    </div>
  )
}
