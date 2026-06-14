import type { Metadata } from "next"
import { Suspense } from "react"

import { BrandsSection } from "@/components/brands-section"
import { GoogleReviewsCarousel } from "@/components/google-reviews-carousel"
import { HeroSection } from "@/components/hero-section"
import { LazyContactSection } from "@/components/lazy-contact-section"
import { PersonalOfferToastLoader } from "@/components/profile/personal-offer-toast-loader"
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
      title: "DeviceHelp - Profesionální oprava mobilních telefonů v Praze",
      description: "Rychlá a kvalitní oprava mobilních telefonů v Praze. Záruka na všechny opravy.",
    },
    en: {
      title: "DeviceHelp - Professional Mobile Phone Repair in Prague",
      description: "Fast and quality mobile phone repair in Prague. Warranty on all repairs.",
    },
    uk: {
      title: "DeviceHelp - Професійний ремонт мобільних телефонів у Празі",
      description: "Швидкий та якісний ремонт мобільних телефонів у Празі. Гарантія на всі ремонти.",
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
