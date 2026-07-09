import type { Metadata } from "next"
import { Suspense } from "react"

import { BrandsSection } from "@/components/brands-section"
import { GoogleReviewsCarousel } from "@/components/google-reviews-carousel"
import { HeroSection } from "@/components/hero-section"
import { LazyContactSection } from "@/components/lazy-contact-section"
import { PersonalOfferToastLoader } from "@/components/profile/personal-offer-toast-loader"
import { PopularRepairs } from "@/components/popular-repairs"
import { getBrands } from "@/lib/data/brands"
import { getGoogleReviews } from "@/lib/data/google-reviews"
import type { GoogleReviewsData } from "@/lib/data/google-reviews"
import { toOGLocale } from "@/lib/og-locale"
import { siteUrl } from "@/lib/site-config"
import { generatePriorityNavigationSchema, generateWebsiteSchema } from "@/lib/structured-data"

const EMPTY_GOOGLE_REVIEWS: GoogleReviewsData = {
  reviews: [],
  rating: 0,
  totalReviews: 0,
}

const SUPPORTED_LOCALE_PARAMS = [{ locale: "cs" }, { locale: "uk" }, { locale: "en" }]

export const revalidate = 3600

export function generateStaticParams() {
  return SUPPORTED_LOCALE_PARAMS
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = siteUrl
  const canonicalUrl = `${baseUrl}/${locale}`

  const seoData = {
    cs: {
      title: "Oprava a servis mobilů a telefonů Praha 6 | DeviceHelp",
      description:
        "Profesionální oprava a servis mobilních telefonů a smartphonů v Praze 6 na Břevnově – iPhone, Samsung, Xiaomi. Výměna displeje a baterie. Záruka 6 měsíců. ☎ +420 775 848 259",
    },
    en: {
      title: "Mobile Phone Repair & Service Prague 6 | DeviceHelp",
      description:
        "Professional mobile phone & smartphone repair and service in Prague 6 Břevnov – iPhone, Samsung, Xiaomi. Screen & battery replacement. 6-month warranty. ☎ +420 775 848 259",
    },
    uk: {
      title: "Ремонт і сервіс мобільних телефонів Прага 6 | DeviceHelp",
      description:
        "Професійний ремонт і сервіс мобільних телефонів та смартфонів у Празі 6 Бржевнов – iPhone, Samsung, Xiaomi. Заміна екрана й батареї. Гарантія 6 місяців. ☎ +420 775 848 259",
    },
  }

  const currentSeo = seoData[locale as keyof typeof seoData] || seoData.cs

  return {
    title: currentSeo.title,
    description: currentSeo.description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        cs: `${baseUrl}/cs`,
        en: `${baseUrl}/en`,
        uk: `${baseUrl}/uk`,
        "x-default": `${baseUrl}/cs`,
      },
    },
    openGraph: {
      title: currentSeo.title,
      description: currentSeo.description,
      url: canonicalUrl,
      siteName: "DeviceHelp",
      locale: toOGLocale(locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: currentSeo.title,
      description: currentSeo.description,
    },
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const brandsPromise = getBrands()
  const googleReviewsPromise = getGoogleReviews(locale)
  const websiteSchema = generateWebsiteSchema(locale)
  const priorityNavigationSchema = generatePriorityNavigationSchema(locale)

  return (
    <>
      <script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        id="priority-navigation-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(priorityNavigationSchema) }}
      />
      <PersonalOfferToastLoader locale={locale} />
      <HeroSection />
      <Suspense fallback={null}>
        <GoogleReviewsAsync promise={googleReviewsPromise} />
      </Suspense>
      <Suspense fallback={null}>
        <BrandsSectionAsync promise={brandsPromise} />
      </Suspense>
      <Suspense fallback={null}>
        <PopularRepairs locale={locale} />
      </Suspense>
      <Suspense fallback={null}>
        <LazyContactSection />
      </Suspense>
    </>
  )
}

async function BrandsSectionAsync({ promise }: { promise: Promise<any> }) {
  const brands = await promise
  return <BrandsSection data={brands} />
}

async function GoogleReviewsAsync({ promise }: { promise: Promise<any> }) {
  try {
    const googleReviews = await promise
    return <GoogleReviewsCarousel data={googleReviews ?? EMPTY_GOOGLE_REVIEWS} />
  } catch (error) {
    console.error("GoogleReviewsAsync error:", error)
    return <GoogleReviewsCarousel data={EMPTY_GOOGLE_REVIEWS} />
  }
}
