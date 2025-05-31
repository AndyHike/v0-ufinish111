import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="p-4">
            <Skeleton className="h-8 w-full max-w-sm" />
          </div>
          <div className="border-t">
            <div className="grid grid-cols-5 p-4">
              {Array(5)
                .fill(null)
                .map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full max-w-[200px]" />
                ))}
            </div>
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="grid grid-cols-5 border-t p-4">
                  {Array(5)
                    .fill(null)
                    .map((_, j) => (
                      <Skeleton key={j} className="h-5 w-full max-w-[200px]" />
                    ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
