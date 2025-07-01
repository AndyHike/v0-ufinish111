import { ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ServiceLoading() {
  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        {/* Кнопка повернення */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Заголовок послуги */}
        <div className="mb-12 rounded-xl bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <Skeleton className="h-32 w-32 rounded-lg" />
            <div className="flex-1 text-center md:text-left">
              <Skeleton className="h-10 w-64 mb-4 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mx-auto md:mx-0" />
            </div>
          </div>
        </div>

        {/* Деталі послуги */}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ секція */}
        <div className="mt-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-white p-4 shadow-sm">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
