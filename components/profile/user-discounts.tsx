"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format-currency"

interface Discount {
  id: string
  code: string
  description: string
  amount: number
  isPercentage: boolean
  expiresAt: string | null
}

export function UserDiscounts({ discounts = [] }: { discounts?: Discount[] }) {
  const t = useTranslations("Profile")

  if (!discounts || discounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("myDiscounts")}</CardTitle>
          <CardDescription>{t("viewDiscounts")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">{t("noDiscountsYet")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("discountsWillBeAvailable")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("myDiscounts")}</CardTitle>
        <CardDescription>{t("viewDiscounts")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {discounts.map((discount) => (
            <div key={discount.id} className="rounded-lg border p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-lg">{discount.code}</p>
                  <p className="text-sm text-gray-500">{discount.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {discount.isPercentage ? `${discount.amount}%` : formatCurrency(discount.amount)}
                  </p>
                  {discount.expiresAt && (
                    <p className="text-xs text-gray-500">
                      {t("expiresOn")} {new Date(discount.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default UserDiscounts
