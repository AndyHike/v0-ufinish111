import { ArrowLeft } from "lucide-react"
import { ServiceCardSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ModelLoading() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        {/* Кнопка повернення */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Заголовок моделі */}
        <PageHeaderSkeleton />

        {/* Розділ послуг */}
        <div>
          <div className="mb-6 border-b pb-2">
            <Skeleton className="h-8 w-48" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
