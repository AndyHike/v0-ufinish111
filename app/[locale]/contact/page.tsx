import type { Metadata } from "next"
import ContactPageClient from "./ContactPageClient"

interface Props {
  params: { locale: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params

  const titlePatterns = {
    cs: "Oprava mobilů Břevnov Praha 6 | DeviceHelp | Bělohorská 209/133 | Kontakt",
    en: "Mobile Phone Repair Břevnov Prague 6 | DeviceHelp | Bělohorská 209/133 | Contact",
    uk: "Ремонт мобільних Бржевнов Прага 6 | DeviceHelp | Bělohorská 209/133 | Контакти",
  }

  const descriptionPatterns = {
    cs: "Oprava mobilů Břevnov, Praha 6. Servis iPhone, Samsung, Xiaomi. Bělohorská 209/133. Telefon: +420 775 848 259. Rychlá oprava, garance 6 měsíců. Dostupné denně 09:00-19:00 (Pondělí-Neděle). Dejvice, Vokovice, Praha 6.",
    en: "Mobile phone repair in Břevnov, Prague 6. iPhone, Samsung, Xiaomi service. Bělohorská 209/133. Phone: +420 775 848 259. Fast repair, 6-month warranty. Available daily 09:00-19:00 (Monday-Sunday). Dejvice, Vokovice, Prague 6.",
    uk: "Ремонт мобільних в Бржевнові, Прага 6. Сервіс iPhone, Samsung, Xiaomi. Bělohorská 209/133. Телефон: +420 775 848 259. Швидкий ремонт, гарантія 6 місяців. Щодня 09:00-19:00 (Понеділок-Неділя). Dejvice, Vokovice, Прага 6.",
  }

  const keywordPatterns = {
    cs: "oprava mobilu brevnov, servis praha 6, oprava iphone praha 6, oprava samsung brevnov, servis mobilů bělohorská, servis telefonu praha 6, rychlá oprava brevnov, ремонт мобилей praha",
    en: "mobile repair brevnov, phone service prague 6, iphone repair prague 6, samsung repair brevnov, mobile service belohorska, phone service prague 6, fast repair brevnov",
    uk: "ремонт мобільних бржевнов, сервіс прага 6, ремонт iphone прага 6, ремонт samsung бржевнов, сервіс мобільних білогорська, сервіс телефонів прага 6, швидкий ремонт бржевнов",
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "DeviceHelp - Oprava mobilních telefonů Praha 6",
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns],
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
    areaServed: ["Praha 6", "Praha6", "Břevnov", "Dejvice", "Vokovice", "Bělohorská", "Белогорська"],
    priceRange: "1500-5000 CZK",
    openingHours: "Mo-Fr 09:00-18:00",
    paymentAccepted: ["Cash", "Credit Card"],
    currenciesAccepted: "CZK",
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    keywords: keywordPatterns[locale as keyof typeof keywordPatterns] || keywordPatterns.en,
    openGraph: {
      title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
      description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
      type: "website",
      locale: locale,
      alternateLocale: ["cs", "en", "uk"].filter((l) => l !== locale),
    },
    twitter: {
      card: "summary",
      title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
      description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    },
    alternates: {
      canonical: `https://www.devicehelp.cz/${locale}/contact`,
      languages: {
        cs: "https://www.devicehelp.cz/cs/contact",
        en: "https://www.devicehelp.cz/en/contact",
        uk: "https://www.devicehelp.cz/uk/contact",
        "x-default": "https://www.devicehelp.cz/cs/contact",
      },
    },
    other: {
      "seznam-wmt": "kEPWnFjKJyWrp9OtNNXIlOe6oNf9vfv4",
    },
  }
}

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "DeviceHelp - Oprava mobilních telefonů Praha 6",
            description: "Profesionální oprava mobilních telefonů v Praze 6 Břevnov - iPhone, Samsung, Xiaomi a dalších značek. Rychlá oprava s garancí 6 měsíců. Bělohorská 209/133, Praha 6-Břevnov.",
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
          }),
        }}
      />
      <ContactPageClient />
    </>
  )
}
