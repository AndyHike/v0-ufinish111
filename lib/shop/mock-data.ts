import type {
  ShopCategory,
  ShopItem,
  ShopLocale,
  ShopLocalizedText,
  ShopSeo,
  ShopStructuredDataFacts,
  ShopVariant,
} from "./types"
import { shopSiteUrl } from "../site-config"

export const SHOP_LOCALES: ShopLocale[] = ["cs", "uk", "en"]

const DEFAULT_PRODUCT_IMAGE = "/tech-fix-storefront.png"

export function localized(cs: string, uk: string, en: string): ShopLocalizedText {
  return { cs, uk, en }
}

function buildShopUrl(locale: ShopLocale, path: string): string {
  return `${shopSiteUrl}/${locale}${path}`
}

function localizedSeoText(base: {
  title: ShopLocalizedText
  description: ShopLocalizedText
  image?: string | null
  facts: ShopStructuredDataFacts
  path: string
}): ShopSeo["locales"] {
  return SHOP_LOCALES.reduce<ShopSeo["locales"]>((locales, locale) => {
    const canonicalUrl = buildShopUrl(locale, base.path)
    const name = base.title[locale] ?? base.title.cs ?? base.title.en ?? ""
    const description = base.description[locale] ?? base.description.cs ?? base.description.en ?? ""

    locales[locale] = {
      metaTitle: name,
      metaDescription: description,
      ogTitle: name,
      ogDescription: description,
      ogImage: base.image ?? null,
      canonicalUrl,
      robots: "index,follow",
      indexable: true,
      structuredDataFacts: {
        ...base.facts,
        canonicalUrl,
        name,
        description,
        image: base.image ?? base.facts.image,
      },
      structuredData: {},
      warnings: [],
    }

    return locales
  }, {})
}

function seo({
  profile,
  schemaType,
  path,
  title,
  description,
  image,
  facts,
}: {
  profile: ShopSeo["profile"]
  schemaType: ShopSeo["schemaType"]
  path: string
  title: ShopLocalizedText
  description: ShopLocalizedText
  image?: string | null
  facts: ShopStructuredDataFacts
}): ShopSeo {
  const canonicalUrl = buildShopUrl("cs", path)

  return {
    profile,
    schemaType,
    indexable: true,
    robots: "index,follow",
    canonicalPathHint: `/cs${path}`,
    canonicalUrl,
    locales: localizedSeoText({ title, description, image, facts, path }),
  }
}

function categorySeo(slug: string, title: ShopLocalizedText, description: ShopLocalizedText, image: string | null): ShopSeo {
  return seo({
    profile: "CATEGORY_LISTING",
    schemaType: "CollectionPage",
    path: `/category/${slug}`,
    title,
    description,
    image,
    facts: {
      kind: "category",
      schemaType: "CollectionPage",
      canonicalUrl: buildShopUrl("cs", `/category/${slug}`),
      name: title.cs ?? slug,
      description: description.cs,
      image: image ?? undefined,
    },
  })
}

export const mockShopCategories: ShopCategory[] = [
  {
    id: "cat-protection",
    parentId: null,
    slug: "protection",
    title: localized("Ochrana telefonu", "Захист телефону", "Phone protection"),
    description: localized(
      "Ochranna skla, pouzdra a doplnky vybrane servisem.",
      "Захисне скло, чохли та аксесуари, підібрані сервісом.",
      "Protective glass, cases, and accessories selected by the service team.",
    ),
    imageUrl: "/focused-phone-fix.png",
    position: 1,
    isActive: true,
    seo: categorySeo(
      "protection",
      localized("Ochrana telefonu | DeviceHelp Shop", "Захист телефону | DeviceHelp Shop", "Phone protection | DeviceHelp Shop"),
      localized(
        "Ochranna skla, pouzdra a ochrana displeje pro telefony.",
        "Захисне скло, чохли та захист дисплея для телефонів.",
        "Protective glass, cases, and display protection for phones.",
      ),
      "/focused-phone-fix.png",
    ),
  },
  {
    id: "cat-display-protection",
    parentId: "cat-protection",
    slug: "display-protection",
    title: localized("Ochrana displeje", "Захист дисплея", "Display protection"),
    description: localized(
      "Skla a folie podle konkretniho modelu telefonu.",
      "Скло та плівки під конкретну модель телефону.",
      "Glass and films matched to exact phone models.",
    ),
    imageUrl: "/focused-phone-fix.png",
    position: 1,
    isActive: true,
    seo: categorySeo(
      "display-protection",
      localized("Ochrana displeje | DeviceHelp Shop", "Захист дисплея | DeviceHelp Shop", "Display protection | DeviceHelp Shop"),
      localized(
        "Ochranna skla a folie pro displeje telefonu.",
        "Захисне скло та плівки для дисплеїв телефонів.",
        "Protective glass and films for phone displays.",
      ),
      "/focused-phone-fix.png",
    ),
  },
  {
    id: "cat-phone-cases",
    parentId: "cat-protection",
    slug: "phone-cases",
    title: localized("Pouzdra a kryty", "Чохли та кейси", "Cases and covers"),
    description: localized(
      "Kryty pro kazdodenni ochranu telefonu.",
      "Чохли для щоденного захисту телефону.",
      "Cases for everyday phone protection.",
    ),
    imageUrl: "/tech-fix-storefront.png",
    position: 2,
    isActive: true,
    seo: categorySeo(
      "phone-cases",
      localized("Pouzdra a kryty | DeviceHelp Shop", "Чохли та кейси | DeviceHelp Shop", "Cases and covers | DeviceHelp Shop"),
      localized(
        "Pouzdra, kryty a ochrana tela telefonu.",
        "Чохли, кейси та захист корпусу телефону.",
        "Cases, covers, and phone body protection.",
      ),
      "/tech-fix-storefront.png",
    ),
  },
  {
    id: "cat-iphone-protection",
    parentId: "cat-display-protection",
    slug: "iphone-protection",
    title: localized("Ochrana pro iPhone", "Захист для iPhone", "iPhone protection"),
    description: localized(
      "Skla a doplnky pro modely iPhone.",
      "Скло та аксесуари для моделей iPhone.",
      "Glass and accessories for iPhone models.",
    ),
    imageUrl: "/focused-phone-fix.png",
    position: 1,
    isActive: true,
    seo: categorySeo(
      "iphone-protection",
      localized("Ochrana pro iPhone | DeviceHelp Shop", "Захист для iPhone | DeviceHelp Shop", "iPhone protection | DeviceHelp Shop"),
      localized(
        "Ochranna skla pro modely iPhone.",
        "Захисне скло для моделей iPhone.",
        "Protective glass for iPhone models.",
      ),
      "/focused-phone-fix.png",
    ),
  },
  {
    id: "cat-samsung-protection",
    parentId: "cat-display-protection",
    slug: "samsung-protection",
    title: localized("Ochrana pro Samsung", "Захист для Samsung", "Samsung protection"),
    description: localized(
      "Skla a doplnky pro modely Samsung Galaxy.",
      "Скло та аксесуари для моделей Samsung Galaxy.",
      "Glass and accessories for Samsung Galaxy models.",
    ),
    imageUrl: "/focused-phone-fix.png",
    position: 2,
    isActive: true,
    seo: categorySeo(
      "samsung-protection",
      localized("Ochrana pro Samsung | DeviceHelp Shop", "Захист для Samsung | DeviceHelp Shop", "Samsung protection | DeviceHelp Shop"),
      localized(
        "Ochranna skla pro Samsung Galaxy.",
        "Захисне скло для Samsung Galaxy.",
        "Protective glass for Samsung Galaxy.",
      ),
      "/focused-phone-fix.png",
    ),
  },
  {
    id: "cat-charging",
    parentId: null,
    slug: "charging",
    title: localized("Nabijeni", "Заряджання", "Charging"),
    description: localized(
      "Nabijecky, kabely a adaptery pro kazdodenni pouziti.",
      "Зарядні пристрої, кабелі та адаптери для щоденного використання.",
      "Chargers, cables, and adapters for everyday use.",
    ),
    imageUrl: "/tech-fix-storefront.png",
    position: 2,
    isActive: true,
    seo: categorySeo(
      "charging",
      localized("Nabijeni | DeviceHelp Shop", "Заряджання | DeviceHelp Shop", "Charging | DeviceHelp Shop"),
      localized(
        "Kabely, nabijecky a adaptery pro mobilni telefony.",
        "Кабелі, зарядні пристрої та адаптери для мобільних телефонів.",
        "Cables, chargers, and adapters for mobile phones.",
      ),
      "/tech-fix-storefront.png",
    ),
  },
  {
    id: "cat-charging-cables",
    parentId: "cat-charging",
    slug: "charging-cables",
    title: localized("Kabely", "Кабелі", "Cables"),
    description: localized(
      "USB-C, Lightning a servisne overene kabely.",
      "USB-C, Lightning та перевірені сервісом кабелі.",
      "USB-C, Lightning, and service-checked cables.",
    ),
    imageUrl: "/tech-fix-storefront.png",
    position: 1,
    isActive: true,
    seo: categorySeo(
      "charging-cables",
      localized("Kabely | DeviceHelp Shop", "Кабелі | DeviceHelp Shop", "Cables | DeviceHelp Shop"),
      localized(
        "Kabely pro nabijeni telefonu a prislusenstvi.",
        "Кабелі для заряджання телефонів та аксесуарів.",
        "Cables for charging phones and accessories.",
      ),
      "/tech-fix-storefront.png",
    ),
  },
  {
    id: "cat-wireless-charging",
    parentId: "cat-charging",
    slug: "wireless-charging",
    title: localized("Bezdratove nabijeni", "Бездротове заряджання", "Wireless charging"),
    description: localized(
      "MagSafe kompatibilni a bezdratove nabijeni.",
      "MagSafe-сумісне та бездротове заряджання.",
      "MagSafe-compatible and wireless charging.",
    ),
    imageUrl: "/tech-fix-storefront.png",
    position: 2,
    isActive: true,
    seo: categorySeo(
      "wireless-charging",
      localized("Bezdratove nabijeni | DeviceHelp Shop", "Бездротове заряджання | DeviceHelp Shop", "Wireless charging | DeviceHelp Shop"),
      localized(
        "Bezdratove nabijecky a MagSafe kompatibilni prislusenstvi.",
        "Бездротові зарядки та MagSafe-сумісні аксесуари.",
        "Wireless chargers and MagSafe-compatible accessories.",
      ),
      "/tech-fix-storefront.png",
    ),
  },
  {
    id: "cat-parts",
    parentId: null,
    slug: "parts",
    title: localized("Nahradni dily", "Запчастини", "Replacement parts"),
    description: localized(
      "Dily pro servis telefonu s jasnou kompatibilitou.",
      "Деталі для ремонту телефонів з чіткою сумісністю.",
      "Phone repair parts with clear compatibility.",
    ),
    imageUrl: "/about-us-pic.jpg",
    position: 3,
    isActive: true,
    seo: categorySeo(
      "parts",
      localized("Nahradni dily | DeviceHelp Shop", "Запчастини | DeviceHelp Shop", "Replacement parts | DeviceHelp Shop"),
      localized(
        "Nahradni dily vybrane servisnim tymem DeviceHelp.",
        "Запчастини, підібрані сервісною командою DeviceHelp.",
        "Replacement parts selected by the DeviceHelp service team.",
      ),
      "/about-us-pic.jpg",
    ),
  },
  {
    id: "cat-batteries",
    parentId: "cat-parts",
    slug: "batteries",
    title: localized("Baterie", "Батареї", "Batteries"),
    description: localized(
      "Nahradni baterie pro servisni opravy telefonu.",
      "Запасні батареї для сервісного ремонту телефонів.",
      "Replacement batteries for phone repair.",
    ),
    imageUrl: "/about-us-pic.jpg",
    position: 1,
    isActive: true,
    seo: categorySeo(
      "batteries",
      localized("Baterie | DeviceHelp Shop", "Батареї | DeviceHelp Shop", "Batteries | DeviceHelp Shop"),
      localized(
        "Nahradni baterie pro vybrane modely telefonu.",
        "Запасні батареї для вибраних моделей телефонів.",
        "Replacement batteries for selected phone models.",
      ),
      "/about-us-pic.jpg",
    ),
  },
  {
    id: "cat-displays",
    parentId: "cat-parts",
    slug: "displays",
    title: localized("Displeje", "Дисплеї", "Displays"),
    description: localized(
      "Displejove moduly a dily pro servis.",
      "Дисплейні модулі та деталі для сервісу.",
      "Display modules and repair parts.",
    ),
    imageUrl: "/focused-phone-fix.png",
    position: 2,
    isActive: true,
    seo: categorySeo(
      "displays",
      localized("Displeje | DeviceHelp Shop", "Дисплеї | DeviceHelp Shop", "Displays | DeviceHelp Shop"),
      localized(
        "Displeje a souvisejici servisni dily.",
        "Дисплеї та повʼязані сервісні деталі.",
        "Displays and related repair parts.",
      ),
      "/focused-phone-fix.png",
    ),
  },
  {
    id: "cat-phones",
    parentId: null,
    slug: "phones",
    title: localized("Telefony", "Телефони", "Phones"),
    description: localized(
      "Pripravovana nabidka overenych telefonu.",
      "Майбутня пропозиція перевірених телефонів.",
      "Upcoming offer of verified phones.",
    ),
    imageUrl: "/tech-fix-storefront.png",
    position: 4,
    isActive: true,
    seo: categorySeo(
      "phones",
      localized("Telefony | DeviceHelp Shop", "Телефони | DeviceHelp Shop", "Phones | DeviceHelp Shop"),
      localized(
        "Telefony pripravovane pro prodej v DeviceHelp Shop.",
        "Телефони, які готуємо до продажу в DeviceHelp Shop.",
        "Phones being prepared for sale in the DeviceHelp Shop.",
      ),
      "/tech-fix-storefront.png",
    ),
  },
]

const categoryBySlug = new Map(mockShopCategories.map((category) => [category.slug, category]))

function requireCategory(slug: string): ShopCategory {
  const category = categoryBySlug.get(slug)
  if (!category) {
    throw new Error(`Missing mock shop category: ${slug}`)
  }

  return category
}

function modelOption(optionSlug: string, optionTitle: ShopLocalizedText) {
  return {
    attributeSlug: "model",
    attributeTitle: localized("Model", "Модель", "Model"),
    optionSlug,
    optionTitle,
  }
}

function singleVariant({
  id,
  itemId,
  title,
  slugOverride,
  price,
  salePrice = null,
  sku,
  stock,
  gtin,
  mpn,
  optionSlug,
  image = DEFAULT_PRODUCT_IMAGE,
}: {
  id: string
  itemId: string
  title: ShopLocalizedText
  slugOverride: string | null
  price: number
  salePrice?: number | null
  sku: string
  stock: number | null
  gtin?: string
  mpn: string
  optionSlug: string
  image?: string
}): ShopVariant {
  return {
    id,
    itemId,
    title,
    slugOverride,
    price,
    salePrice,
    sku,
    barcode: `INTERNAL-${sku}`,
    gtin,
    mpn,
    isDefault: true,
    trackInventory: true,
    selectedOptions: [modelOption(optionSlug, title)],
    images: [image],
    availability: { availableStock: stock },
  }
}

function productSeo({
  slug,
  title,
  description,
  image,
  brand,
  defaultVariant,
  schemaType = "Product",
  variants,
}: {
  slug: string
  title: ShopLocalizedText
  description: ShopLocalizedText
  image: string
  brand: string
  defaultVariant: ShopVariant
  schemaType?: "Product" | "ProductGroup"
  variants?: ShopVariant[]
}): ShopSeo {
  const path = `/product/${slug}`
  const canonicalUrl = buildShopUrl("cs", path)

  return seo({
    profile: "PRODUCT_DETAIL",
    schemaType,
    path,
    title,
    description,
    image,
    facts: {
      kind: "product",
      schemaType,
      canonicalUrl,
      name: title.cs ?? slug,
      description: description.cs,
      image,
      brand,
      condition: "new",
      price: defaultVariant.price,
      salePrice: defaultVariant.salePrice,
      currency: "CZK",
      sku: defaultVariant.sku,
      barcode: defaultVariant.barcode,
      gtin: defaultVariant.gtin,
      mpn: defaultVariant.mpn,
      availability: defaultVariant.availability.availableStock === 0 ? "out_of_stock" : "in_stock",
      variants: variants?.map((variant) => ({
        id: variant.id,
        slug: variant.slugOverride ?? slug,
        title: variant.title.cs ?? slug,
        canonicalUrl: buildShopUrl("cs", `/product/${slug}${variant.slugOverride ? `/${variant.slugOverride}` : ""}`),
        price: variant.price,
        salePrice: variant.salePrice,
        currency: "CZK",
        sku: variant.sku,
        barcode: variant.barcode,
        gtin: variant.gtin,
        mpn: variant.mpn,
        availability: variant.availability.availableStock === 0 ? "out_of_stock" : "in_stock",
      })),
    },
  })
}

const protectiveGlassVariants: ShopVariant[] = [
  {
    ...singleVariant({
      id: "variant-glass-default",
      itemId: "item-protective-glass",
      title: localized("iPhone 13", "iPhone 13", "iPhone 13"),
      slugOverride: "protective-glass-iphone-13",
      price: 249,
      sku: "GLASS-IP13",
      stock: 7,
      gtin: "00012345678905",
      mpn: "GLASS-IP13",
      optionSlug: "iphone-13",
      image: "/focused-phone-fix.png",
    }),
    isDefault: true,
  },
  {
    ...singleVariant({
      id: "variant-glass-iphone-11",
      itemId: "item-protective-glass",
      title: localized("iPhone 11", "iPhone 11", "iPhone 11"),
      slugOverride: "protective-glass-iphone-11",
      price: 229,
      salePrice: 199,
      sku: "GLASS-IP11",
      stock: 3,
      gtin: "00012345678912",
      mpn: "GLASS-IP11",
      optionSlug: "iphone-11",
      // Demo: differs from the default variant so the variant-switch photo
      // update is visible in local dev.
      image: "/tech-fix-storefront.png",
    }),
    slugLocalized: { uk: "zakhysne-sklo-iphone-11", en: "screen-protector-iphone-11" },
    isDefault: false,
  },
  {
    ...singleVariant({
      id: "variant-glass-iphone-12",
      itemId: "item-protective-glass",
      title: localized("iPhone 12", "iPhone 12", "iPhone 12"),
      slugOverride: "protective-glass-iphone-12",
      price: 239,
      sku: "GLASS-IP12",
      stock: 0,
      gtin: "00012345678950",
      mpn: "GLASS-IP12",
      optionSlug: "iphone-12",
      image: "/focused-phone-fix.png",
    }),
    isDefault: false,
  },
]

const modelTestGlassModels = [
  { slug: "iphone-15-pro-max", title: "iPhone 15 Pro Max", price: 349, salePrice: 299, stock: 8 },
  { slug: "iphone-15-pro", title: "iPhone 15 Pro", price: 329, salePrice: null, stock: 6 },
  { slug: "iphone-15", title: "iPhone 15", price: 299, salePrice: null, stock: 11 },
  { slug: "iphone-14-pro-max", title: "iPhone 14 Pro Max", price: 329, salePrice: 289, stock: 3 },
  { slug: "iphone-14-pro", title: "iPhone 14 Pro", price: 319, salePrice: null, stock: 4 },
  { slug: "iphone-14", title: "iPhone 14", price: 289, salePrice: null, stock: 0 },
  { slug: "iphone-13-pro-max", title: "iPhone 13 Pro Max", price: 299, salePrice: 259, stock: 7 },
  { slug: "iphone-13-pro", title: "iPhone 13 Pro", price: 289, salePrice: null, stock: 5 },
  { slug: "iphone-13", title: "iPhone 13", price: 249, salePrice: null, stock: 12 },
  { slug: "iphone-12-pro-max", title: "iPhone 12 Pro Max", price: 279, salePrice: null, stock: 2 },
  { slug: "iphone-12-pro", title: "iPhone 12 Pro", price: 269, salePrice: 229, stock: 0 },
  { slug: "iphone-12", title: "iPhone 12", price: 239, salePrice: null, stock: 9 },
  { slug: "iphone-11-pro-max", title: "iPhone 11 Pro Max", price: 249, salePrice: null, stock: 1 },
  { slug: "iphone-11-pro", title: "iPhone 11 Pro", price: 239, salePrice: null, stock: 4 },
  { slug: "iphone-11", title: "iPhone 11", price: 229, salePrice: 199, stock: 6 },
  { slug: "samsung-s24-ultra", title: "Samsung Galaxy S24 Ultra", price: 369, salePrice: 329, stock: 5 },
  { slug: "samsung-s24-plus", title: "Samsung Galaxy S24+", price: 349, salePrice: null, stock: 3 },
  { slug: "samsung-s24", title: "Samsung Galaxy S24", price: 329, salePrice: null, stock: 7 },
  { slug: "samsung-s23-ultra", title: "Samsung Galaxy S23 Ultra", price: 349, salePrice: null, stock: 0 },
  { slug: "samsung-s23", title: "Samsung Galaxy S23", price: 299, salePrice: 269, stock: 10 },
  { slug: "samsung-a55", title: "Samsung Galaxy A55", price: 249, salePrice: null, stock: 8 },
  { slug: "samsung-a54", title: "Samsung Galaxy A54", price: 239, salePrice: null, stock: 4 },
  { slug: "samsung-a35", title: "Samsung Galaxy A35", price: 229, salePrice: 199, stock: 0 },
  { slug: "samsung-a34", title: "Samsung Galaxy A34", price: 219, salePrice: null, stock: 6 },
] as const

const modelTestProtectiveGlassVariants: ShopVariant[] = modelTestGlassModels.map((model, index) => ({
  ...singleVariant({
    id: `variant-model-test-glass-${model.slug}`,
    itemId: "item-model-test-protective-glass",
    title: localized(model.title, model.title, model.title),
    slugOverride: `model-test-glass-${model.slug}`,
    price: model.price,
    salePrice: model.salePrice,
    sku: `TEST-GLASS-${model.slug.toUpperCase().replace(/-/g, "-")}`,
    stock: model.stock,
    gtin: `00012345679${String(index).padStart(3, "0")}`,
    mpn: `TEST-GLASS-${model.slug.toUpperCase().replace(/-/g, "-")}`,
    optionSlug: model.slug,
    image: "/focused-phone-fix.png",
  }),
  isDefault: index === 0,
}))

const usbCableVariant: ShopVariant = {
  ...singleVariant({
    id: "variant-usb-c-cable-default",
    itemId: "item-usb-c-cable",
    title: localized("USB-C 1 m", "USB-C 1 м", "USB-C 1 m"),
    slugOverride: null,
    price: 299,
    sku: "CABLE-USBC-1M",
    stock: 12,
    gtin: "00012345678929",
    mpn: "CABLE-USBC-1M",
    optionSlug: "usb-c-1m",
    image: "/tech-fix-storefront.png",
  }),
  // Demo: multiple photos so the gallery/card multi-image UI is exercised.
  images: ["/tech-fix-storefront.png", "/focused-phone-fix.png", "/about-us-pic.jpg"],
}

const magsafeVariant = singleVariant({
  id: "variant-magsafe-charger-default",
  itemId: "item-magsafe-charger",
  title: localized("MagSafe kompatibilni", "MagSafe сумісний", "MagSafe compatible"),
  slugOverride: null,
  price: 890,
  salePrice: 790,
  sku: "CHARGER-MAGSAFE",
  stock: 5,
  gtin: "00012345678936",
  mpn: "CHARGER-MAGSAFE",
  optionSlug: "magsafe-compatible",
  image: "/tech-fix-storefront.png",
})

const batteryVariant: ShopVariant = {
  ...singleVariant({
    id: "variant-iphone-battery-13",
    itemId: "item-iphone-battery",
    title: localized("iPhone 13", "iPhone 13", "iPhone 13"),
    slugOverride: "iphone-battery-13",
    price: 1190,
    sku: "BATTERY-IP13",
    stock: 2,
    gtin: "00012345678943",
    mpn: "BATTERY-IP13",
    optionSlug: "iphone-13",
    image: "/about-us-pic.jpg",
  }),
  // Demo: multiple photos for the gallery/card multi-image UI.
  images: ["/about-us-pic.jpg", "/tech-fix-storefront.png"],
}

export const mockShopItems: ShopItem[] = [
  {
    id: "item-protective-glass",
    slug: "protective-glass",
    // Per-locale slugs as the admin generates them; the default locale stays
    // on the canonical `slug` (see PUBLIC_API_DOCS §2.3).
    slugLocalized: { uk: "zakhysne-sklo", en: "screen-protector" },
    title: localized("Premiove ochranne sklo", "Преміальне захисне скло", "Premium protective glass"),
    description: localized(
      "Tenké ochranné sklo s přesným výřezem a servisním doporučením.",
      "Тонке захисне скло з точною посадкою та рекомендацією сервісу.",
      "Thin protective glass with precise fit and service-team approval.",
    ),
    content: localized(
      "Vhodne pro zakazniky, kteri chteji cistou instalaci a jistotu kompatibility.",
      "Підійде клієнтам, яким потрібна чиста установка та впевненість у сумісності.",
      "Built for customers who want clean installation and confident compatibility.",
    ),
    images: ["/focused-phone-fix.png"],
    brand: "DeviceHelp",
    condition: "new",
    attributes: [
      {
        attributeKeyId: "ckey_coverage",
        attributeSlug: "coverage",
        attributeTitle: localized("Pokryti", "Покриття", "Coverage"),
        options: [
          {
            optionId: "copt_coverage_full",
            optionSlug: "full",
            optionTitle: localized("Full cover", "Повне покриття", "Full cover"),
          },
        ],
      },
    ],
    attributeValues: [
      {
        attributeKeyId: "ckey_hardness",
        attributeSlug: "hardness",
        attributeTitle: localized("Tvrdost", "Твердість", "Hardness"),
        type: "NUMBER",
        valueText: null,
        valueNumber: 9,
        valueBool: null,
      },
    ],
    specs: { warranty: "24 months" },
    categories: [
      requireCategory("protection"),
      requireCategory("display-protection"),
      requireCategory("iphone-protection"),
      requireCategory("samsung-protection"),
    ],
    variants: protectiveGlassVariants,
    linkedItems: [{ type: "accessory", targetSlug: "usb-c-cable" }],
    seo: productSeo({
      slug: "protective-glass",
      title: localized("Premiove ochranne sklo | DeviceHelp Shop", "Преміальне захисне скло | DeviceHelp Shop", "Premium protective glass | DeviceHelp Shop"),
      description: localized(
        "Premiove ochranne sklo pro iPhone s dostupnosti podle modelu.",
        "Преміальне захисне скло для iPhone з наявністю за моделлю.",
        "Premium iPhone protective glass with model-based availability.",
      ),
      image: "/focused-phone-fix.png",
      brand: "DeviceHelp",
      defaultVariant: protectiveGlassVariants[0],
      schemaType: "ProductGroup",
      variants: protectiveGlassVariants,
    }),
  },
  {
    id: "item-model-test-protective-glass",
    slug: "model-test-protective-glass",
    title: localized("Testovaci sklo pro mnoho modelu", "Тестове скло для багатьох моделей", "Test glass for many models"),
    description: localized(
      "Mock produkt pro kontrolu vyberu variant u velkeho poctu modelu.",
      "Mock-товар для перевірки вибору варіантів при великій кількості моделей.",
      "Mock product for checking variant selection across many phone models.",
    ),
    content: localized(
      "Tento produkt slouzi jen pro UX kontrolu selectoru variant. V realnem katalogu ho nahradi data z API.",
      "Цей товар потрібен тільки для UX-перевірки selector-а варіантів. У реальному каталозі його замінять дані з API.",
      "This product exists only for UX validation of the variant selector. Real API data will replace it later.",
    ),
    images: ["/focused-phone-fix.png"],
    brand: "DeviceHelp",
    condition: "new",
    attributes: [],
    attributeValues: [],
    specs: {},
    categories: [requireCategory("protection"), requireCategory("display-protection"), requireCategory("iphone-protection")],
    variants: modelTestProtectiveGlassVariants,
    linkedItems: [{ type: "accessory", targetSlug: "usb-c-cable" }],
    seo: productSeo({
      slug: "model-test-protective-glass",
      title: localized(
        "Testovaci sklo pro mnoho modelu | DeviceHelp Shop",
        "Тестове скло для багатьох моделей | DeviceHelp Shop",
        "Test glass for many models | DeviceHelp Shop",
      ),
      description: localized(
        "Mock produkt s 24 variantami pro kontrolu UX vyberu modelu.",
        "Mock-товар із 24 варіантами для перевірки UX вибору моделі.",
        "Mock product with 24 variants for checking model selection UX.",
      ),
      image: "/focused-phone-fix.png",
      brand: "DeviceHelp",
      defaultVariant: modelTestProtectiveGlassVariants[0],
      schemaType: "ProductGroup",
      variants: modelTestProtectiveGlassVariants,
    }),
  },
  {
    id: "item-usb-c-cable",
    slug: "usb-c-cable",
    title: localized("Odolny USB-C kabel", "Міцний USB-C кабель", "Durable USB-C cable"),
    description: localized(
      "Kazdodenni kabel pro nabijeni telefonu a prislusenstvi.",
      "Щоденний кабель для заряджання телефону та аксесуарів.",
      "Everyday cable for charging phones and accessories.",
    ),
    content: localized(
      "Pevny kabel s dobrym pomerem ceny a vydrze pro servisni i domaci pouziti.",
      "Міцний кабель з хорошим балансом ціни та витривалості для сервісу й дому.",
      "A sturdy cable with a practical balance of price and durability.",
    ),
    images: ["/tech-fix-storefront.png"],
    brand: "DeviceHelp",
    condition: "new",
    attributes: [],
    attributeValues: [],
    specs: {},
    categories: [requireCategory("charging"), requireCategory("charging-cables")],
    variants: [usbCableVariant],
    linkedItems: [{ type: "related", targetSlug: "magsafe-charger" }],
    seo: productSeo({
      slug: "usb-c-cable",
      title: localized("Odolny USB-C kabel | DeviceHelp Shop", "Міцний USB-C кабель | DeviceHelp Shop", "Durable USB-C cable | DeviceHelp Shop"),
      description: localized(
        "USB-C kabel pro rychle a spolehlive nabijeni.",
        "USB-C кабель для швидкого та надійного заряджання.",
        "USB-C cable for fast and reliable charging.",
      ),
      image: "/tech-fix-storefront.png",
      brand: "DeviceHelp",
      defaultVariant: usbCableVariant,
    }),
  },
  {
    id: "item-magsafe-charger",
    slug: "magsafe-charger",
    title: localized("MagSafe kompatibilni nabijecka", "MagSafe сумісна зарядка", "MagSafe compatible charger"),
    description: localized(
      "Bezdratove nabijeni pro iPhone s cistym pracovnim stolem.",
      "Бездротове заряджання для iPhone та охайного робочого місця.",
      "Wireless charging for iPhone and a cleaner desk setup.",
    ),
    content: localized(
      "Dobra volba pro zakazniky, kteri chteji pohodlne nabijeni bez zbytecnych kabelu.",
      "Хороший вибір для клієнтів, які хочуть зручне заряджання без зайвих кабелів.",
      "A good fit for customers who want convenient charging without extra cable clutter.",
    ),
    images: ["/tech-fix-storefront.png"],
    brand: "DeviceHelp",
    condition: "new",
    attributes: [],
    attributeValues: [],
    specs: {},
    categories: [requireCategory("charging"), requireCategory("wireless-charging")],
    variants: [magsafeVariant],
    linkedItems: [{ type: "cross_sell", targetSlug: "usb-c-cable" }],
    seo: productSeo({
      slug: "magsafe-charger",
      title: localized("MagSafe kompatibilni nabijecka | DeviceHelp Shop", "MagSafe сумісна зарядка | DeviceHelp Shop", "MagSafe compatible charger | DeviceHelp Shop"),
      description: localized(
        "MagSafe kompatibilni nabijecka se skladovou dostupnosti.",
        "MagSafe сумісна зарядка зі складською наявністю.",
        "MagSafe compatible charger with stock availability.",
      ),
      image: "/tech-fix-storefront.png",
      brand: "DeviceHelp",
      defaultVariant: magsafeVariant,
    }),
  },
  {
    id: "item-iphone-battery",
    slug: "iphone-battery",
    title: localized("Baterie pro iPhone", "Батарея для iPhone", "iPhone battery"),
    description: localized(
      "Nahradni baterie pro servisni opravy vybranych modelu.",
      "Запасна батарея для сервісного ремонту вибраних моделей.",
      "Replacement battery for repair work on selected models.",
    ),
    content: localized(
      "Produkt je pripraveny pro zakazniky, kteri chteji dil spolu se servisnim doporucenim.",
      "Товар підготовлений для клієнтів, які хочуть деталь разом із сервісною рекомендацією.",
      "Prepared for customers who want a part backed by service-team guidance.",
    ),
    images: ["/about-us-pic.jpg"],
    brand: "DeviceHelp",
    condition: "new",
    attributes: [],
    attributeValues: [],
    specs: {},
    categories: [requireCategory("parts"), requireCategory("batteries")],
    variants: [batteryVariant],
    linkedItems: [{ type: "upsell", targetSlug: "protective-glass" }],
    seo: productSeo({
      slug: "iphone-battery",
      title: localized("Baterie pro iPhone | DeviceHelp Shop", "Батарея для iPhone | DeviceHelp Shop", "iPhone battery | DeviceHelp Shop"),
      description: localized(
        "Nahradni baterie pro iPhone s jasnou dostupnosti.",
        "Запасна батарея для iPhone з чіткою наявністю.",
        "Replacement iPhone battery with clear availability.",
      ),
      image: "/about-us-pic.jpg",
      brand: "DeviceHelp",
      defaultVariant: batteryVariant,
    }),
  },
]
