import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonModelCard } from "@/components/ui/skeleton-card"

export default function SeriesLoading() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Back button skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Series header skeleton */}
        <div className="mb-12 rounded-xl bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <Skeleton className="h-24 w-24 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-10 w-48 mb-3" />
              <Skeleton className="h-5 w-full max-w-2xl" />
            </div>
          </div>
        </div>

        {/* Models section skeleton */}
        <div>
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonModelCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
