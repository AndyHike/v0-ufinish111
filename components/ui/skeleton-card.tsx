import { Skeleton } from "@/components/ui/skeleton"

export function BrandCardSkeleton() {
  return (
    <div className="group flex flex-col items-center rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-slate-50 p-3">
        <Skeleton className="h-10 w-10" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

export function ModelCardSkeleton() {
  return (
    <div className="group flex flex-col items-center rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-slate-50 p-2 sm:h-24 sm:w-24">
        <Skeleton className="h-16 w-16 sm:h-20 sm:w-20" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

export function SeriesCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg bg-white p-5 shadow-md">
      <div className="absolute bottom-0 left-0 top-0 w-1 bg-slate-200"></div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  )
}

export function ServiceCardSkeleton() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-12 rounded-xl bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center gap-6 md:flex-row">
        <Skeleton className="h-24 w-24 rounded-lg" />
        <div className="flex-1 text-center md:text-left">
          <Skeleton className="h-8 w-48 mb-3 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mx-auto md:mx-0" />
        </div>
      </div>
    </div>
  )
}
