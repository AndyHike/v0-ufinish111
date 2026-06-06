import Image from "next/image"
import Link from "next/link"

import { ProductCardAction } from "@/components/shop/product-card-action"
import { formatShopPrice } from "@/lib/shop/catalog"
import type { ShopLocale, ShopProductCardView } from "@/lib/shop/types"

const FROM_LABEL: Record<ShopLocale, string> = {
  cs: "od",
  uk: "від",
  en: "from",
}

type AvailabilityTone = "in" | "low" | "out"

function availabilityTone(product: ShopProductCardView): AvailabilityTone {
  if (!product.isPurchasable) {
    return "out"
  }
  if (product.availableStock !== null && product.availableStock <= 3) {
    return "low"
  }
  return "in"
}

const TONE_DOT: Record<AvailabilityTone, string> = {
  in: "bg-emerald-500",
  low: "bg-amber-500",
  out: "bg-gray-300",
}

const TONE_TEXT: Record<AvailabilityTone, string> = {
  in: "text-emerald-700",
  low: "text-amber-700",
  out: "text-gray-400",
}

export function ProductCard({
  product,
  locale,
  compact = false,
}: {
  product: ShopProductCardView
  locale: ShopLocale
  compact?: boolean
}) {
  const tone = availabilityTone(product)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={product.href} className="flex min-w-0 flex-1 flex-col">
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes={compact ? "(max-width: 768px) 50vw, 280px" : "(max-width: 768px) 50vw, 320px"}
            className={`object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
              product.images.length > 1 ? "group-hover:opacity-0" : ""
            }`}
          />
          {/* Second photo previewed on hover (desktop) when the product has more
              than one image. */}
          {product.images.length > 1 ? (
            <Image
              src={product.images[1]}
              alt={product.title}
              fill
              sizes={compact ? "(max-width: 768px) 50vw, 280px" : "(max-width: 768px) 50vw, 320px"}
              className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          ) : null}
          {/* Multi-photo indicator dots. */}
          {product.images.length > 1 ? (
            <span className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
              {product.images.slice(0, 5).map((src, index) => (
                <span
                  key={src}
                  className={`h-1.5 w-1.5 rounded-full ${index === 0 ? "bg-gray-900" : "bg-gray-900/30"}`}
                  aria-hidden
                />
              ))}
            </span>
          ) : null}
          {product.discountPercent ? (
            <span className="absolute left-2 top-2 rounded-md bg-gray-950 px-2 py-1 text-xs font-semibold text-white">
              -{product.discountPercent}%
            </span>
          ) : null}
          {!product.isPurchasable ? (
            <span className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-600 backdrop-blur">
              {product.availabilityLabel}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col px-3 pt-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-950">{product.title}</h3>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {product.priceFrom ? (
              <span className="text-xs font-medium text-gray-500">{FROM_LABEL[locale]}</span>
            ) : null}
            <span className="text-base font-semibold text-gray-950">{formatShopPrice(product.displayPrice, locale)}</span>
            {product.compareAtPrice ? (
              <span className="text-sm text-gray-400 line-through">{formatShopPrice(product.compareAtPrice, locale)}</span>
            ) : null}
          </div>

          <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${TONE_TEXT[tone]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} aria-hidden />
            {product.availabilityLabel}
          </p>
        </div>
      </Link>

      <div className="px-3 pb-3 pt-3">
        <ProductCardAction product={product} locale={locale} />
      </div>
    </article>
  )
}
