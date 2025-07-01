import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonModelCard } from "@/components/ui/skeleton-card"

export default function BrandLoading() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Back button skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Brand header skeleton */}
        <div className="mb-12 flex flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-sm md:flex-row">
          <Skeleton className="h-32 w-32 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-10 w-48 mb-3" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </div>
        </div>

        {/* Series section skeleton */}
        <div className="mb-12">
          <Skeleton className="h-8 w-40 mb-8" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="group relative overflow-hidden rounded-lg bg-white p-5 shadow-md">
                <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary"></div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Models section skeleton */}
        <div>
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonModelCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
