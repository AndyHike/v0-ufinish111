import { useTranslations } from "next-intl"
import { formatCurrency } from "@/lib/format-currency"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDiscountValue } from "@/lib/discounts/utils"
import type { Discount } from "@/lib/discounts/types"

interface ServicePriceDisplayProps {
  originalPrice?: number | null
  discountedPrice?: number | null
  hasDiscount?: boolean
  discount?: Discount
  actualDiscountPercentage?: number
  size?: "sm" | "md" | "lg"
  showBadge?: boolean
  priceOnRequest?: boolean
  isLoading?: boolean
}

export function ServicePriceDisplay({
  originalPrice,
  discountedPrice,
  hasDiscount = false,
  discount,
  actualDiscountPercentage,
  size = "md",
  showBadge = true,
  priceOnRequest = false,
  isLoading = false,
}: ServicePriceDisplayProps) {
  const t = useTranslations("Services")

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

  // If price on request or no price available
  if (priceOnRequest || !originalPrice) {
    return (
      <div className={`font-bold text-gray-900 ${sizeClasses[size]}`} suppressHydrationWarning>
        {t("priceOnRequest")}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 w-24">
        <Skeleton className={`h-7 w-full`} />
      </div>
    )
  }

  return (
    <div className="relative transition-all duration-500 ease-in-out" suppressHydrationWarning>
      {(!hasDiscount || !discountedPrice) ? (
        <div className={`font-bold text-gray-900 ${sizeClasses[size]} animate-in fade-in duration-500`}>
          {formatCurrency(originalPrice)}
        </div>
      ) : (
        <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-1 duration-500">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
              {formatCurrency(discountedPrice)}
            </div>
            {showBadge && discount && (
              <Badge variant="destructive" className="text-xs animate-in zoom-in duration-500">
                -{formatDiscountValue(discount, actualDiscountPercentage)}
              </Badge>
            )}
          </div>
          <div className={`text-gray-500 line-through ${oldPriceSizeClasses[size]}`}>
            {formatCurrency(originalPrice)}
          </div>
        </div>
      )}
    </div>
  )
}
