import { ProductCard } from "@/components/shop/product-card"
import { ShopCategorySidebar } from "@/components/shop/shop-category-sidebar"
import { ShopHeroCarousel, type ShopHeroSlide } from "@/components/shop/shop-hero-carousel"
import type { ShopCategoryTreeNode, ShopLocale, ShopProductCardView } from "@/lib/shop/types"

const SHOP_HOME_COPY = {
  cs: {
    eyebrow: "DeviceHelp Shop",
    catalog: "Katalog",
    recommended: "Doporucene produkty",
    recommendedHint: "Vyber servisniho tymu pro kazdodenni pouziti.",
    carouselLabel: "Akcni nabidky",
    heroSlides: [
      ["Novinky v shopu", "Ochrana displeje, nabijeni a dily vybrane nasim servisem.", "Prohlizet novinky"],
      ["Sleva na ochranu displeje", "Vybrana skla pro iPhone se startovni cenou od 199 Kc.", "Zobrazit akci"],
      ["Dily presne podle modelu", "Varianty produktu jsou pripravene na vyber konkretniho telefonu.", "Vybrat model"],
    ],
  },
  uk: {
    eyebrow: "DeviceHelp Shop",
    catalog: "Каталог",
    recommended: "Рекомендовані товари",
    recommendedHint: "Вибір сервісної команди для щоденного використання.",
    carouselLabel: "Акційні пропозиції",
    heroSlides: [
      ["Новинки магазину", "Захист дисплея, заряджання та деталі, підібрані нашим сервісом.", "Переглянути новинки"],
      ["Знижка на захист дисплея", "Вибрані стекла для iPhone зі стартовою ціною від 199 Kč.", "Показати акцію"],
      ["Деталі точно під модель", "Варіанти товарів готові до вибору конкретного телефону.", "Вибрати модель"],
    ],
  },
  en: {
    eyebrow: "DeviceHelp Shop",
    catalog: "Catalog",
    recommended: "Recommended products",
    recommendedHint: "Picked by the service team for everyday use.",
    carouselLabel: "Promotional offers",
    heroSlides: [
      ["New in shop", "Display protection, charging, and parts selected by our service team.", "Browse new"],
      ["Display protection sale", "Selected iPhone glass variants starting from 199 Kc.", "View offer"],
      ["Parts matched to your model", "Product variants are ready for exact phone model selection.", "Choose model"],
    ],
  },
} as const

// Non-localized media + routing for hero slides; copy is matched by index.
// Images use existing public assets until real banners arrive from the API.
const HERO_SLIDE_MEDIA = [
  { href: "category/protection", image: "/focused-phone-fix.png" },
  { href: "category/display-protection", image: "/tech-fix-storefront.png" },
  { href: "category/parts", image: "/about-us-pic.jpg" },
] as const

// Two rows of cards on every breakpoint: 2 columns on phone/tablet (4 cards),
// 4 columns on desktop (8 cards). Cards past the 4th are desktop-only.
const FEATURED_LIMIT = 8
const MOBILE_VISIBLE = 4

export function ShopHomePage({
  locale,
  heroTitle,
  heroDescription,
  categoryTree,
  featuredProducts,
}: {
  locale: ShopLocale
  heroTitle: string
  heroDescription: string
  heroImage: string
  categoryTree: ShopCategoryTreeNode[]
  featuredProducts: ShopProductCardView[]
}) {
  const copy = SHOP_HOME_COPY[locale]

  const slides: ShopHeroSlide[] = copy.heroSlides.map(([title, text, action], index) => ({
    title,
    text,
    action,
    href: `/${locale}/${HERO_SLIDE_MEDIA[index].href}`,
    image: HERO_SLIDE_MEDIA[index].image,
  }))

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-white text-gray-950">
      {/* Visually-hidden H1/description keep a single descriptive heading for
          SEO/a11y; the visible hierarchy is carried by the carousel and headings. */}
      <h1 className="sr-only">{heroTitle}</h1>
      <p className="sr-only">{heroDescription}</p>

      <div className="lg:flex lg:items-start">
        {/* Permanent category tree on desktop; on mobile the catalog lives in the
            header drawer, so the sidebar is hidden below lg. */}
        <ShopCategorySidebar
          locale={locale}
          nodes={categoryTree}
          title={copy.catalog}
          className="hidden lg:sticky lg:top-20 lg:z-30 lg:block lg:min-h-[calc(100vh-5rem)] lg:w-[280px] lg:shrink-0 lg:border-r lg:border-gray-100"
        />

        <main className="min-w-0 flex-1">
          <div className="px-4 py-6 md:px-6">
            <section>
              <ShopHeroCarousel slides={slides} eyebrow={copy.eyebrow} ariaLabel={copy.carouselLabel} />
            </section>

            <section className="py-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">{copy.recommended}</h2>
                  <p className="mt-1 text-sm text-gray-500">{copy.recommendedHint}</p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                {featuredProducts.slice(0, FEATURED_LIMIT).map((product, index) => (
                  <div key={product.itemId} className={index >= MOBILE_VISIBLE ? "hidden h-full lg:block" : "h-full"}>
                    <ProductCard locale={locale} product={product} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
