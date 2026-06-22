import type React from "react"
import { notFound } from "next/navigation"

import { SiteLocaleLayout } from "@/components/site-locale-layout"
import { SHOP_ENABLED } from "@/lib/shop-routing"
import "@/app/globals.css"

export default async function ShopLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Storefront kill switch: render nothing under the shop tree while it is off.
  if (!SHOP_ENABLED) {
    notFound()
  }

  const { locale } = await params

  return (
    <SiteLocaleLayout locale={locale} variant="shop" showPromotionalBanner={false} includeLocalBusinessSchema={false}>
      {children}
    </SiteLocaleLayout>
  )
}
