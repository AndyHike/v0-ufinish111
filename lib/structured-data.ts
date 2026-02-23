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
    "@id": "https://devicehelp.cz/#business",
    url: "https://devicehelp.cz",
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
