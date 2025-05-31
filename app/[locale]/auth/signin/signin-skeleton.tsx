import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function SignInSkeleton() {
  return (
    <Card className="border shadow-sm">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="flex justify-center">
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
