import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BadgePercent, PackageSearch, ShieldCheck, Sparkles, Smartphone, Truck } from "lucide-react"

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
    allCategories: "Vsechny kategorie",
    categoriesTitle: "Kategorie obchodu",
    categoriesText: "Zacnete ochranou, nabijenim, nahradnimi dily nebo telefony.",
    recommended: "Doporucene produkty",
    promoBanners: [
      ["Novinky v shopu", "Ochrana displeje, nabijeni a dily vybrane servisem.", "Prohlizet novinky"],
      ["Sleva na ochranu", "Vybrane skla pro iPhone se startovni cenou od 199 Kc.", "Zobrazit akci"],
      ["Dily podle modelu", "Varianty produktu jsou pripravene na vyber konkretniho telefonu.", "Vybrat model"],
    ],
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
    allCategories: "Усі категорії",
    categoriesTitle: "Категорії магазину",
    categoriesText: "Почніть із захисту, заряджання, запчастин або телефонів.",
    recommended: "Рекомендовані товари",
    promoBanners: [
      ["Новинки магазину", "Захист дисплея, заряджання та деталі, підібрані сервісом.", "Переглянути"],
      ["Знижка на захист", "Вибрані стекла для iPhone зі стартовою ціною від 199 Kč.", "Показати акцію"],
      ["Деталі під модель", "Варіанти готові до вибору конкретного телефону.", "Вибрати модель"],
    ],
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
    allCategories: "All categories",
    categoriesTitle: "Shop categories",
    categoriesText: "Start with protection, charging, parts, or phones.",
    recommended: "Recommended products",
    promoBanners: [
      ["New in shop", "Display protection, charging, and parts selected by the service team.", "Browse new"],
      ["Protection sale", "Selected iPhone glass variants starting from 199 Kc.", "View offer"],
      ["Parts by model", "Variants are ready for exact phone model selection.", "Choose model"],
    ],
    benefits: [
      ["Checked compatibility", "Product variants stay tied to exact phone models."],
      ["Delivery ready", "Checkout will be prepared for Packeta integration."],
      ["Selected by service", "The assortment follows real DeviceHelp repair experience."],
    ],
  },
} as const

const benefitIcons = [ShieldCheck, Truck, Sparkles]
const promoIcons = [Sparkles, BadgePercent, PackageSearch]

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
    <div className="w-full max-w-full overflow-x-hidden bg-white text-gray-950">
      <section className="border-b border-gray-100">
        <div className="container grid min-w-0 gap-8 px-4 py-8 md:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:py-12">
          <div className="w-full min-w-0 max-w-full">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-500">{copy.eyebrow}</p>
            <h1 className="mt-4 max-w-full break-words text-[1.75rem] font-semibold leading-tight tracking-tight text-gray-950 sm:max-w-3xl sm:text-4xl md:text-5xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-full break-words text-base leading-7 text-gray-600 sm:max-w-xl">{heroDescription || copy.description}</p>
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

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {copy.promoBanners.map(([title, text, action], index) => {
              const Icon = promoIcons[index]
              const isPrimary = index === 0

              return (
                <Link
                  key={title}
                  href={`/${locale}/category/${index === 2 ? "parts" : "protection"}`}
                  className={`group rounded-lg border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                    isPrimary
                      ? "border-gray-950 bg-gray-950 text-white sm:col-span-2"
                      : "border-gray-200 bg-white text-gray-950"
                  }`}
                >
                  <div className={isPrimary ? "grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center" : ""}>
                    <div className="min-w-0">
                      <Icon className={isPrimary ? "h-5 w-5 text-white" : "h-5 w-5 text-gray-900"} />
                      <h2 className="mt-4 break-words text-xl font-semibold tracking-tight">{title}</h2>
                      <p className={isPrimary ? "mt-2 text-sm leading-6 text-gray-200" : "mt-2 text-sm leading-6 text-gray-600"}>
                        {text}
                      </p>
                      <span className={isPrimary ? "mt-5 inline-flex text-sm font-semibold text-white" : "mt-5 inline-flex text-sm font-semibold text-gray-950"}>
                        {action}
                        <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    {isPrimary ? (
                      <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-md bg-white/10 sm:mt-0">
                        <Image
                          src={heroImage}
                          alt={heroTitle}
                          fill
                          priority
                          sizes="(max-width: 1024px) 100vw, 220px"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container px-4 py-12 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{copy.allCategories}</h2>
            <p className="mt-2 text-sm text-gray-600">{copy.categoriesText}</p>
          </div>
          <Link href={`/${locale}/category/protection`} className="inline-flex items-center text-sm font-semibold text-gray-950">
            {copy.categoriesTitle}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/category/${category.slug}`}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-gray-100">
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
              <h3 className="mt-4 flex items-center gap-2 font-semibold">
                <Smartphone className="h-4 w-4 text-gray-500" />
                {getLocalizedText(category.title, locale)}
              </h3>
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
