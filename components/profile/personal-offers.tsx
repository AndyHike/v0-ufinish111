"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Gift, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PersonalProfileOffer } from "@/lib/discounts/profile-offers"

export function PersonalOffers({
  offers,
  locale,
}: {
  offers: PersonalProfileOffer[]
  locale: string
}) {
  const t = useTranslations("Profile")

  if (!offers.length) return null

  return (
    <Card className="overflow-hidden border-emerald-200 bg-emerald-50/40 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg">{t("specialOffersTitle")}</CardTitle>
            <CardDescription>{t("specialOffersDescription")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {offers.map((offer) => (
            <div key={offer.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-gray-950">{offer.title}</p>
                  {offer.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{offer.description}</p>
                  )}
                </div>
                <Badge className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700">
                  -{offer.discountValueLabel}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                {offer.targetLabel && (
                  <div className="flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{offer.targetLabel}</span>
                  </div>
                )}
                {offer.remainingUses !== null && (
                  <p>{t("offerUsesLeft", { count: offer.remainingUses })}</p>
                )}
                {offer.expiresAt && (
                  <p>
                    {t("offerExpiresOn", {
                      date: new Date(offer.expiresAt).toLocaleDateString(locale),
                    })}
                  </p>
                )}
              </div>

              <Button asChild size="sm" className="mt-4 w-full">
                <Link href={offer.actionHref || `/${locale}/profile`}>
                  {offer.actionHref ? t("useOffer") : t("viewServices")}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
