import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react"

import { ProductCard } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { getLocalizedText } from "@/lib/shop/catalog"
import type { ShopCategory, ShopLocale, ShopProductCardView } from "@/lib/shop/types"

const SHOP_HOME_COPY = {
  cs: {
    eyebrow: "DeviceHelp Shop",
    description: "Vybrane prislusenstvi, dily a budouci telefony od servisniho tymu DeviceHelp.",
    browse: "Prohlizet produkty",
    parts: "Nahradni dily",
    categoriesTitle: "Kategorie obchodu",
    categoriesText: "Zacnete ochranou, nabijenim, nahradnimi dily nebo telefony.",
    recommended: "Doporucene produkty",
    benefits: [
      ["Overena kompatibilita", "Varianty produktu zustavaji navazane na konkretni modely."],
      ["Pripraveno na doruceni", "Checkout bude pocitat s Packeta integraci."],
      ["Vybrano servisem", "Sortiment navazuje na realne servisni zkusenosti DeviceHelp."],
    ],
  },
  uk: {
    eyebrow: "DeviceHelp Shop",
    description: "Підібрані аксесуари, запчастини та майбутні телефони від сервісної команди DeviceHelp.",
    browse: "Переглянути товари",
    parts: "Запчастини",
    categoriesTitle: "Категорії магазину",
    categoriesText: "Почніть із захисту, заряджання, запчастин або телефонів.",
    recommended: "Рекомендовані товари",
    benefits: [
      ["Перевірена сумісність", "Варіанти товарів привʼязані до конкретних моделей."],
      ["Готово до доставки", "Checkout буде підготовлений до інтеграції Packeta."],
      ["Підібрано сервісом", "Асортимент спирається на реальний сервісний досвід DeviceHelp."],
    ],
  },
  en: {
    eyebrow: "DeviceHelp Shop",
    description: "Selected accessories, parts, and future phone offers from the DeviceHelp service team.",
    browse: "Browse products",
    parts: "Repair parts",
    categoriesTitle: "Shop categories",
    categoriesText: "Start with protection, charging, parts, or phones.",
    recommended: "Recommended products",
    benefits: [
      ["Checked compatibility", "Product variants stay tied to exact phone models."],
      ["Delivery ready", "Checkout will be prepared for Packeta integration."],
      ["Selected by service", "The assortment follows real DeviceHelp repair experience."],
    ],
  },
} as const

const benefitIcons = [ShieldCheck, Truck, Sparkles]

export function ShopHomePage({
  locale,
  heroTitle,
  heroDescription,
  heroImage,
  categories,
  featuredProducts,
}: {
  locale: ShopLocale
  heroTitle: string
  heroDescription: string
  heroImage: string
  categories: ShopCategory[]
  featuredProducts: ShopProductCardView[]
}) {
  const copy = SHOP_HOME_COPY[locale]

  return (
    <div className="bg-white text-gray-950">
      <section className="border-b border-gray-100">
        <div className="container grid gap-10 px-4 py-10 md:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-500">{copy.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-gray-950 md:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600">{heroDescription || copy.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={`/${locale}/category/protection`}>
                  {copy.browse}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/${locale}/category/parts`}>{copy.parts}</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_0.82fr]">
            <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <Image src={heroImage} alt={heroTitle} fill priority sizes="(max-width: 1024px) 100vw, 620px" className="object-cover" />
            </div>
            <div className="grid gap-4">
              {featuredProducts.slice(0, 2).map((product) => (
                <ProductCard key={product.itemId} locale={locale} product={product} compact />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-12 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{copy.categoriesTitle}</h2>
            <p className="mt-2 text-sm text-gray-600">{copy.categoriesText}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/category/${category.slug}`}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={getLocalizedText(category.title, locale)}
                    fill
                    sizes="(max-width: 1024px) 50vw, 280px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <h3 className="mt-4 font-semibold">{getLocalizedText(category.title, locale)}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{getLocalizedText(category.description, locale)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-100 bg-gray-50 py-12">
        <div className="container grid gap-4 px-4 md:grid-cols-3 md:px-6">
          {copy.benefits.map(([title, text], index) => {
            const Icon = benefitIcons[index]
            return (
              <div key={title} className="rounded-lg border border-gray-200 bg-white p-5">
                <Icon className="h-5 w-5 text-gray-900" />
                <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="container px-4 py-12 md:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">{copy.recommended}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.itemId} locale={locale} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
