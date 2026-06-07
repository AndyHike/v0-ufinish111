"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useTranslations } from "next-intl"

import { LanguageSwitcher } from "@/components/language-switcher"
import { ShopCartDrawer } from "@/components/shop/shop-cart-drawer"
import { ShopCatalogDrawer } from "@/components/shop/shop-catalog-drawer"
import { ShopSearch } from "@/components/shop/shop-search"
import { SiteLogo } from "@/components/site-logo"
import { useShopCart } from "@/components/shop/shop-cart-provider"
import type { ShopCategoryTreeNode, ShopLocale } from "@/lib/shop/types"

export function ShopHeader({
  locale,
  categoryTree = [],
}: {
  locale: ShopLocale
  categoryTree?: ShopCategoryTreeNode[]
}) {
  const t = useTranslations("Shop.header")
  const { count, openCart } = useShopCart()

  return (
    <>
      <header className="sticky top-0 z-40 w-full overflow-x-clip border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container flex h-16 min-w-0 items-center justify-between gap-2 px-4 md:gap-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <ShopCatalogDrawer locale={locale} nodes={categoryTree} variant="icon" triggerClassName="lg:hidden" />
            <Link href={`/${locale}`} className="flex min-w-0 max-w-[44vw] items-center gap-2 sm:max-w-none sm:gap-3">
              <SiteLogo size="md" />
              <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-gray-950">DeviceHelp Shop</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
            <ShopSearch locale={locale} />
            <LanguageSwitcher className="h-9 w-9 shrink-0" />
            <button
              type="button"
              data-testid="shop-cart-link"
              className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-800 transition-colors hover:bg-gray-50"
              aria-label={t("cart")}
              onClick={openCart}
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 ? (
                <span
                  data-testid="shop-cart-count"
                  className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground"
                >
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>
      <ShopCartDrawer locale={locale} />
    </>
  )
}
