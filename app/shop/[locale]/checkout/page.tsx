import type { Metadata } from "next"

import { ShopCheckoutPage } from "@/components/shop/shop-checkout-page"
import { getShopIntegrations } from "@/lib/shop/data"
import type { ShopLocale } from "@/lib/shop/types"

export const metadata: Metadata = {
  title: "Checkout | DeviceHelp Shop",
  robots: "noindex,follow",
}

export const dynamic = "force-dynamic"

export default async function ShopCheckoutRoute({ params }: { params: Promise<{ locale: ShopLocale }> }) {
  const { locale } = await params
  const { packeta, stripe, comgate } = await getShopIntegrations()

  return <ShopCheckoutPage locale={locale} packeta={packeta} stripe={stripe} comgate={comgate} />
}
