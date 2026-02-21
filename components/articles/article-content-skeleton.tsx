import { Skeleton } from "@/components/ui/skeleton"

export function ArticleContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <Skeleton className="h-12 w-3/4 mb-4" />
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Featured Image */}
      <Skeleton className="w-full h-96 rounded-lg" />

      {/* Content Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full mt-6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Related Articles Section */}
      <div className="mt-12 pt-8 border-t">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
