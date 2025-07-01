import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonBrandCard } from "@/components/ui/skeleton-card"

export default function BrandsLoading() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Back button skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-32" />
        </div>

        {/* Header skeleton */}
        <div className="mb-12 text-center">
          <Skeleton className="h-10 w-48 mx-auto mb-3" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>

        {/* Brands grid skeleton */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonBrandCard key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
