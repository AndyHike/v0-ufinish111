import type { Metadata } from "next"
import ContactPageClient from "./ContactPageClient"

interface Props {
  params: { locale: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params

  const titlePatterns = {
    cs: "Kontakt | DeviceHelp - Profesionální oprava mobilních zařízení",
    en: "Contact | DeviceHelp - Professional Mobile Device Repair",
    uk: "Контакти | DeviceHelp - Професійний ремонт мобільних пристроїв",
  }

  const descriptionPatterns = {
    cs: "Kontaktujte nás pro opravu vašeho mobilního zařízení. Bělohorská 209/133, Praha 6-Břevnov. Telefon: +420 775 848 259. Rychlá a kvalitní oprava telefonů, tabletů a dalších zařízení.",
    en: "Contact us for your mobile device repair. Bělohorská 209/133, Prague 6-Břevnov. Phone: +420 775 848 259. Fast and quality repair of phones, tablets and other devices.",
    uk: "Зв'яжіться з нами для ремонту вашого мобільного пристрою. Bělohorská 209/133, Прага 6-Břevnov. Телефон: +420 775 848 259. Швидкий та якісний ремонт телефонів, планшетів та інших пристроїв.",
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    keywords:
      locale === "cs"
        ? "kontakt, oprava telefonu, servis mobilů, Praha, Břevnov, DeviceHelp"
        : locale === "uk"
          ? "контакти, ремонт телефону, сервіс мобільних, Прага, Břevnov, DeviceHelp"
          : "contact, phone repair, mobile service, Prague, Břevnov, DeviceHelp",
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
  }
}

export default function ContactPage() {
  return <ContactPageClient />
}
