import type { Metadata } from "next"

import { ShopCartPage } from "@/components/shop/shop-cart-page"
import type { ShopLocale } from "@/lib/shop/types"

export const metadata: Metadata = {
  title: "Cart | DeviceHelp Shop",
  robots: "noindex,follow",
}

export default async function ShopCartRoute({ params }: { params: Promise<{ locale: ShopLocale }> }) {
  const { locale } = await params

  return <ShopCartPage locale={locale} />
}
