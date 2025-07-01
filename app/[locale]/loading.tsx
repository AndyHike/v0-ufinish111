import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonCard, SkeletonBrandCard } from "@/components/ui/skeleton-card"

export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero section skeleton */}
      <section className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
            <div className="space-x-4 mt-8">
              <Skeleton className="h-11 w-32 inline-block" />
              <Skeleton className="h-11 w-32 inline-block" />
            </div>
          </div>
        </div>
      </section>

      {/* Services section skeleton */}
      <section className="py-12 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Brands section skeleton */}
      <section className="py-12 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-10">
            <Skeleton className="h-8 w-32 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBrandCard key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
