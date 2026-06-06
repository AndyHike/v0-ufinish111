"use client"

import Link from "next/link"
import { Search, ShoppingBag } from "lucide-react"
import { useTranslations } from "next-intl"

import { LanguageSwitcher } from "@/components/language-switcher"
import { ShopCartDrawer } from "@/components/shop/shop-cart-drawer"
import { SiteLogo } from "@/components/site-logo"
import { useShopCart } from "@/components/shop/shop-cart-provider"
import { Button } from "@/components/ui/button"
import type { ShopLocale } from "@/lib/shop/types"

export function ShopHeader({ locale }: { locale: ShopLocale }) {
  const t = useTranslations("Shop.header")
  const { count, openCart } = useShopCart()
  const navItems = [
    { label: t("protection"), href: `/${locale}/category/protection` },
    { label: t("charging"), href: `/${locale}/category/charging` },
    { label: t("parts"), href: `/${locale}/category/parts` },
    { label: t("phones"), href: `/${locale}/category/phones` },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 w-full overflow-x-hidden border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container flex h-16 min-w-0 items-center justify-between gap-2 px-4 md:gap-4 md:px-6">
          <Link href={`/${locale}`} className="flex min-w-0 max-w-[52vw] items-center gap-2 sm:max-w-none sm:gap-3">
            <SiteLogo size="md" />
            <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-gray-950">DeviceHelp Shop</span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-gray-700 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-gray-950">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="hidden gap-2 text-gray-700 md:inline-flex">
              <Search className="h-4 w-4" />
              {t("search")}
            </Button>
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

        <nav className="container flex max-w-full gap-2 overflow-x-auto border-t border-gray-100 px-4 py-2 text-sm font-medium text-gray-700 lg:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1.5">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <ShopCartDrawer locale={locale} />
    </>
  )
}
