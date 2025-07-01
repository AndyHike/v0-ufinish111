import { HeroSection } from "@/components/hero-section"
import { ContactSection } from "@/components/contact-section"
import { InfoBanner } from "@/components/info-banner"
import { Suspense, lazy } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Динамічний імпорт - завантажується тільки коли потрібно
const BrandsSectionAsync = lazy(() => import("@/components/brands-section-async"))

function BrandsSkeleton() {
  return (
    <section className="py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-64 mx-auto mb-3" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex flex-col items-center space-y-2">
                <Skeleton className="h-12 w-12 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      {/* ⚡ Статичні компоненти - завантажуються миттєво */}
      <InfoBanner />
      <HeroSection />

      {/* 🔄 Динамічний компонент - завантажується асинхронно */}
      <Suspense fallback={<BrandsSkeleton />}>
        <BrandsSectionAsync />
      </Suspense>

      {/* ⚡ Знову статичний контент */}
      <ContactSection />
    </>
  )
}
