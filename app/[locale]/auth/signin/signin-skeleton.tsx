import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SignInSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-col items-center space-y-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="flex justify-center">
          <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
    </Card>
  )
}
