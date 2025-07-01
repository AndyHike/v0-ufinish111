import { BrandCardSkeleton } from "@/components/ui/skeleton-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero секція */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <Skeleton className="h-12 w-96 mx-auto mb-6" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-8" />
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </section>

      {/* Бренди секція */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <Skeleton className="h-8 w-48 mx-auto mb-4" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>

            <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <BrandCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Послуги секція */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <Skeleton className="h-8 w-56 mx-auto mb-4" />
              <Skeleton className="h-4 w-80 mx-auto" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-white p-6 shadow-sm">
                  <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
