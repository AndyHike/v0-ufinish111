import Image from "next/image"
import Link from "next/link"

import { formatShopPrice } from "@/lib/shop/catalog"
import type { ShopLocale, ShopProductCardView } from "@/lib/shop/types"

export function ProductCard({
  product,
  locale,
  compact = false,
}: {
  product: ShopProductCardView
  locale: ShopLocale
  compact?: boolean
}) {
  const displayPrice = product.salePrice ?? product.price

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={product.href} className="block">
        <div className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes={compact ? "(max-width: 768px) 50vw, 280px" : "(max-width: 768px) 50vw, 320px"}
            className="object-cover"
          />
        </div>
        <div className={compact ? "mt-3" : "mt-4"}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-950">{product.title}</h3>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-base font-semibold">{formatShopPrice(displayPrice, locale)}</span>
            {product.salePrice ? (
              <span className="text-sm text-gray-400 line-through">{formatShopPrice(product.price, locale)}</span>
            ) : null}
          </div>
          <p className="mt-2 text-xs font-medium text-gray-500">{product.availabilityLabel}</p>
        </div>
      </Link>
    </article>
  )
}
