import type { Metadata } from "next"
import { headers } from "next/headers"
import { B2BHomePage } from "@/components/b2b/b2b-home-page"
import { HeroSection } from "@/components/hero-section"
import { ContactSection } from "@/components/contact-section"
import { BrandsSection } from "@/components/brands-section"
import { GoogleReviewsCarousel } from "@/components/google-reviews-carousel"
import { isB2BHost } from "@/lib/b2b-routing"
import { getBrands } from "@/lib/data/brands"
import { getGoogleReviews } from "@/lib/data/google-reviews"
import { Suspense } from "react"
import { toOGLocale } from "@/lib/og-locale"
import { b2bSiteUrl, siteUrl } from "@/lib/site-config"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""

  if (isB2BHost(host)) {
    const b2bSeoData = {
      cs: {
        title: "B2B servis mobilních telefonů pro firmy | DeviceHelp",
        description:
          "Opravy firemních mobilních telefonů pro firmy, OSVČ a organizace v Praze. Registrace firemního účtu, záruka a jasná komunikace.",
      },
      uk: {
        title: "Ремонт мобільних телефонів для компаній | DeviceHelp",
        description:
          "Ремонт службових мобільних телефонів для компаній, підприємців та організацій у Празі. Реєстрація акаунта для компанії, гарантія та зрозуміла комунікація.",
      },
      en: {
        title: "Mobile Phone Repair for Companies | DeviceHelp",
        description:
          "Company mobile phone repairs for businesses, entrepreneurs, and organizations in Prague. Business account registration, warranty, and clear communication.",
      },
    }

    const currentSeo = b2bSeoData[locale as keyof typeof b2bSeoData] || b2bSeoData.cs
    const canonicalUrl = `${b2bSiteUrl}/${locale}`

    return {
      title: currentSeo.title,
      description: currentSeo.description,
      metadataBase: new URL(b2bSiteUrl),
      alternates: {
        canonical: canonicalUrl,
        languages: {
          cs: `${b2bSiteUrl}/cs`,
          uk: `${b2bSiteUrl}/uk`,
          en: `${b2bSiteUrl}/en`,
          "x-default": `${b2bSiteUrl}/cs`,
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

function BrandsSectionSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-8 animate-pulse"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}

function ContactSectionSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-8 animate-pulse"></div>
      <div className="max-w-md mx-auto space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  )
}

function GoogleReviewsSkeleton() {
  return (
    <section className="py-12 bg-white border-b">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4 animate-pulse"></div>
          <div className="flex gap-1 justify-center mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="h-6 bg-gray-200 rounded w-40 mx-auto animate-pulse"></div>
        </div>
        <div className="hidden md:grid grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""

  if (isB2BHost(host)) {
    return <B2BHomePage locale={locale} />
  }

  const brandsPromise = getBrands()
  const googleReviewsPromise = getGoogleReviews()

  return (
    <>
      <HeroSection />
      <Suspense fallback={null}>
        <GoogleReviewsAsync promise={googleReviewsPromise} />
      </Suspense>
      <Suspense fallback={null}>
        <BrandsSectionAsync promise={brandsPromise} />
      </Suspense>
      <Suspense fallback={null}>
        <ContactSection />
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
    return googleReviews ? <GoogleReviewsCarousel data={googleReviews} /> : null
  } catch (error) {
    console.error("GoogleReviewsAsync error:", error)
    return null
  }
}
