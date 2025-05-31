import { Skeleton } from "@/components/ui/skeleton"

export default function ModelLoading() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl">
        <Skeleton className="mb-8 h-6 w-32" />

        <div className="mb-12 flex flex-col items-center gap-6 md:flex-row">
          <Skeleton className="h-40 w-40 rounded-lg" />
          <div className="w-full">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="mb-2 h-10 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        <Skeleton className="mb-6 h-8 w-48" />

        <div className="grid gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex flex-col rounded-lg border p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="w-2/3">
                    <Skeleton className="mb-2 h-6 w-1/2" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
                <div className="mt-4 flex justify-end">
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
