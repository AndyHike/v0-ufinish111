import { mainSiteUrl } from "@/lib/site-config"

const priorityPages = {
  cs: {
    name: "Důležité stránky DeviceHelp",
    pages: [
      { name: "Oprava Samsung", path: "/brands/samsung" },
      { name: "Oprava Apple", path: "/brands/apple" },
      { name: "Oprava Xiaomi", path: "/brands/xiaomi" },
      { name: "Kontakt", path: "/contact" },
    ],
  },
  en: {
    name: "Important DeviceHelp pages",
    pages: [
      { name: "Samsung repair", path: "/brands/samsung" },
      { name: "Apple repair", path: "/brands/apple" },
      { name: "Xiaomi repair", path: "/brands/xiaomi" },
      { name: "Contact", path: "/contact" },
    ],
  },
  uk: {
    name: "Важливі сторінки DeviceHelp",
    pages: [
      { name: "Ремонт Samsung", path: "/brands/samsung" },
      { name: "Ремонт Apple", path: "/brands/apple" },
      { name: "Ремонт Xiaomi", path: "/brands/xiaomi" },
      { name: "Контакти", path: "/contact" },
    ],
  },
}

export function generateWebsiteSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${mainSiteUrl}/#website`,
    url: mainSiteUrl,
    name: "DeviceHelp",
    alternateName: ["Device Help", "DeviceHelp.cz"],
    inLanguage: locale,
  }
}

export function generatePriorityNavigationSchema(locale: string) {
  const data = priorityPages[locale as keyof typeof priorityPages] || priorityPages.cs

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${mainSiteUrl}/${locale}#priority-navigation`,
    name: data.name,
    itemListElement: data.pages.map((page, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: page.name,
      url: `${mainSiteUrl}/${locale}${page.path}`,
    })),
  }
}

export function generateBreadcrumbListSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateLocalBusinessSchema(locale: string) {
  const businessData = {
    cs: {
      name: "DeviceHelp - Oprava mobilních telefonů Praha 6 Břevnov",
      description: "Profesionální servis mobilních telefonů. Oprava iPhone, Samsung, Xiaomi. Střídavá garance 6 měsíců. Bělohorská 209/133, Praha 6.",
    },
    en: {
      name: "DeviceHelp - Mobile Phone Repair Prague 6 Břevnov",
      description: "Professional mobile phone repair service. iPhone, Samsung, Xiaomi repair. 6-month warranty. Bělohorská 209/133, Prague 6.",
    },
    uk: {
      name: "DeviceHelp - Ремонт мобільних телефонів Прага 6 Бржевнов",
      description: "Професійний сервіс ремонту мобільних телефонів. Ремонт iPhone, Samsung, Xiaomi. Гарантія 6 місяців. Bělohorská 209/133, Прага 6.",
    },
  }

  const data = businessData[locale as keyof typeof businessData] || businessData.en

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${mainSiteUrl}/#business`,
    url: mainSiteUrl,
    logo: `${mainSiteUrl}/icon-light-32x32.png`,
    image: `${mainSiteUrl}/tech-fix-storefront.png`,
    name: data.name,
    description: data.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Bělohorská 209/133",
      addressLocality: "Praha 6-Břevnov",
      addressRegion: "Praha",
      postalCode: "169 00",
      addressCountry: "CZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "50.0982",
      longitude: "14.3917",
    },
    telephone: "+420775848259",
    email: "info@devicehelp.cz",
    hasMap: "https://maps.app.goo.gl/Uw4EPBKqk6RauBRz7",
    areaServed: [
      {
        "@type": "City",
        name: "Praha 6-Břevnov",
      },
      {
        "@type": "City",
        name: "Dejvice",
      },
      {
        "@type": "City",
        name: "Vokovice",
      },
    ],
    priceRange: "1500-5000 CZK",
    paymentAccepted: ["Cash", "Credit Card"],
    currenciesAccepted: "CZK",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:00",
        closes: "19:00",
      },
    ],
  }
}

export function generateServiceSchema(serviceName: string, price: number | null, locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: serviceName,
    provider: generateLocalBusinessSchema(locale),
    areaServed: "Praha 6",
    offers: {
      "@type": "Offer",
      price: price ? `${price} CZK` : undefined,
      priceCurrency: "CZK",
      warranty: "6 months",
    },
  }
}
