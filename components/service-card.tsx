"use client"

import Link from "next/link"
import { formatCurrency } from "@/lib/format-currency"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Service = {
  id: number
  slug: string
  price: number
  icon_url?: string | null
  services_translations: { name: string } | null
}

export function ServiceCard({
  service,
  locale,
}: {
  service: Service
  locale: string
}) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <Link href={`/${locale}/services/${service.slug}`}>
        <CardHeader className="flex items-center gap-4">
          {service.icon_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={service.icon_url || "/placeholder.svg"}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded bg-muted object-contain"
            />
          )}
          <CardTitle className="text-base font-semibold">{service.services_translations?.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-lg font-bold">{formatCurrency(service.price, locale)}</span>
          <Button size="sm" variant="secondary" className="shrink-0">
            Детальніше
          </Button>
        </CardContent>
      </Link>
    </Card>
  )
}
