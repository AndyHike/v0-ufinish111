import type { Metadata } from "next"
import ContactPageClient from "./ContactPageClient"

interface Props {
  params: { locale: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params

  const titlePatterns = {
    cs: "Kontakt Praha 6 Břevnov | DeviceHelp | Bělohorská 209/133 | Oprava mobilů",
    en: "Contact Prague 6 Břevnov | DeviceHelp | Bělohorská 209/133 | Mobile Repair",
    uk: "Контакти Прага 6 Бржевнов | DeviceHelp | Bělohorská 209/133 | Ремонт мобільних",
  }

  const descriptionPatterns = {
    cs: "Kontaktujte DeviceHelp pro opravu mobilů v Praze 6 Břevnově. Bělohorská 209/133 (Белогорська). Telefon: +420 775 848 259. Servis iPhone, Samsung, Xiaomi. Praha6, Dejvice, Vokovice.",
    en: "Contact DeviceHelp for mobile repair in Prague 6 Břevnov. Bělohorská 209/133. Phone: +420 775 848 259. iPhone, Samsung, Xiaomi service. Praha6, Dejvice, Vokovice area.",
    uk: "Зв'яжіться з DeviceHelp для ремонту мобільних в Празі 6 Бржевнов. Bělohorská 209/133 (Белогорська). Телефон: +420 775 848 259. Сервіс iPhone, Samsung, Xiaomi. Praha6, Dejvice, Vokovice.",
  }

  const keywordPatterns = {
    cs: "kontakt Praha 6, oprava telefonu Břevnov, servis mobilů Bělohorská, DeviceHelp Praha6, oprava iPhone Břevnov, servis Samsung Praha 6, Белогорська 133",
    en: "contact Prague 6, phone repair Břevnov, mobile service Bělohorská, DeviceHelp Praha6, iPhone repair Břevnov, Samsung service Prague 6",
    uk: "контакти Прага 6, ремонт телефону Бржевнов, сервіс мобільних Белогорська, DeviceHelp Praha6, ремонт iPhone Бржевнов, сервіс Samsung Прага 6",
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
    serviceType: "Mobile Phone Repair",
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
            serviceType: "Mobile Phone Repair",
            priceRange: "1500-5000 CZK",
          }),
        }}
      />
      <ContactPageClient />
    </>
  )
}
