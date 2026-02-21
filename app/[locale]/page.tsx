import { HeroSection } from "@/components/hero-section"
import { ContactSection } from "@/components/contact-section"
import { BrandsSection } from "@/components/brands-section"
import { InfoBanner } from "@/components/info-banner"
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
