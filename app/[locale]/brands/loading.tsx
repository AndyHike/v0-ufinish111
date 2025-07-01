import { BrandCardSkeleton } from "@/components/ui/skeleton-card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"

export default function BrandsLoading() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Кнопка повернення */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Заголовок */}
        <div className="mb-12 text-center">
          <Skeleton className="h-10 w-48 mx-auto mb-3" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>

        {/* Сітка брендів */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <BrandCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
