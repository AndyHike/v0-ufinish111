export function generateLocalBusinessSchema(locale: string) {
  const businessData = {
    cs: {
      name: "DeviceHelp - Oprava mobilních telefonů Praha 6",
      description: "Profesionální oprava mobilních telefonů v Praze 6 Břevnov",
    },
    en: {
      name: "DeviceHelp - Mobile Phone Repair Prague 6",
      description: "Professional mobile phone repair in Prague 6 Břevnov",
    },
    uk: {
      name: "DeviceHelp - Ремонт мобільних телефонів Прага 6",
      description: "Професійний ремонт мобільних телефонів в Празі 6 Бржевнов",
    },
  }

  const data = businessData[locale as keyof typeof businessData] || businessData.en

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
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
    areaServed: ["Praha 6", "Břevnov", "Dejvice", "Vokovice", "Bělohorská"],
    serviceType: "Mobile Phone Repair",
    priceRange: "1500-5000 CZK",
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
