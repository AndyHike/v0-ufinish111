import { HeroSection } from "@/components/hero-section"
import { ContactSection } from "@/components/contact-section"
import { BrandsSection } from "@/components/brands-section"
import { InfoBanner } from "@/components/info-banner"
import { GoogleReviewsCarousel } from "@/components/google-reviews-carousel"
import { getBrands } from "@/lib/data/brands"
import { getInfoBanner } from "@/lib/data/info-banner"
import { Suspense } from "react"

export const revalidate = 3600 // Revalidate every hour

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
    <section className="py-12 bg-gradient-to-b from-blue-50 to-white">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4 animate-pulse"></div>
          <div className="flex gap-1 justify-center mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="h-6 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
        </div>
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function HomePage() {
  const infoBannerPromise = getInfoBanner()
  const brandsPromise = getBrands()

  // Don't await here - let hero render immediately
  return (
    <>
      <Suspense fallback={null}>
        <InfoBannerAsync promise={infoBannerPromise} />
      </Suspense>
      <HeroSection />
      <GoogleReviewsCarousel />
      <Suspense fallback={<BrandsSectionSkeleton />}>
        <BrandsSectionAsync promise={brandsPromise} />
      </Suspense>
      <Suspense fallback={<ContactSectionSkeleton />}>
        <ContactSection />
      </Suspense>
    </>
  )
}

async function InfoBannerAsync({ promise }: { promise: Promise<any> }) {
  const infoBanner = await promise
  return infoBanner ? <InfoBanner data={infoBanner} /> : null
}

async function BrandsSectionAsync({ promise }: { promise: Promise<any> }) {
  const brands = await promise
  return <BrandsSection data={brands} />
}
