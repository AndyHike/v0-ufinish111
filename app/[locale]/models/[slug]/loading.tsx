import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonServiceCard } from "@/components/ui/skeleton-card"

export default function ModelLoading() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        {/* Back button skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Model header skeleton */}
        <div className="mb-12 rounded-xl bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <Skeleton className="h-32 w-32 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-10 w-64 mb-3" />
              <Skeleton className="h-5 w-full max-w-2xl" />
            </div>
          </div>
        </div>

        {/* Services section skeleton */}
        <div>
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonServiceCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
