import { SeriesCardSkeleton, ModelCardSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton-card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"

export default function BrandPageLoading() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Кнопка повернення */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Заголовок бренду */}
        <PageHeaderSkeleton />

        {/* Розділ серій */}
        <div className="mb-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SeriesCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Розділ моделей */}
        <div>
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <ModelCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
