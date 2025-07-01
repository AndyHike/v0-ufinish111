import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function SkeletonCard() {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-6 flex flex-col items-center justify-center h-32">
        <Skeleton className="h-16 w-16 rounded-lg mb-3" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  )
}

export function SkeletonBrandCard() {
  return (
    <Card className="p-6 flex flex-col items-center justify-center h-[120px]">
      <Skeleton className="h-12 w-12 rounded-full mb-2" />
      <Skeleton className="h-4 w-20" />
    </Card>
  )
}

export function SkeletonModelCard() {
  return (
    <div className="group flex flex-col items-center rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-slate-50 p-2 sm:h-24 sm:w-24">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

export function SkeletonServiceCard() {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-4 mt-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </Card>
  )
}
