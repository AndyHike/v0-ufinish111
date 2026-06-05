import type React from "react"

import { SiteLocaleLayout } from "@/components/site-locale-layout"
import "@/app/globals.css"

export default async function ShopLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <SiteLocaleLayout locale={locale} variant="shop" showPromotionalBanner={false} includeLocalBusinessSchema={false}>
      {children}
    </SiteLocaleLayout>
  )
}
