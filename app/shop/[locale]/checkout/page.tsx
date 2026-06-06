import type { Metadata } from "next"

import { ShopCheckoutPage } from "@/components/shop/shop-checkout-page"
import type { ShopLocale } from "@/lib/shop/types"

export const metadata: Metadata = {
  title: "Checkout | DeviceHelp Shop",
  robots: "noindex,follow",
}

export default async function ShopCheckoutRoute({ params }: { params: Promise<{ locale: ShopLocale }> }) {
  const { locale } = await params

  return <ShopCheckoutPage locale={locale} />
}
