import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscountsList } from "@/components/admin/discounts-list"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default function DiscountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Знижки</h1>
          <p className="text-muted-foreground">Керуйте знижками для користувачів.</p>
        </div>
        <Button asChild>
          <Link href="/admin/discounts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Додати знижку
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Всі знижки</CardTitle>
          <CardDescription>Список всіх знижок у вашій системі.</CardDescription>
        </CardHeader>
        <CardContent>
          <DiscountsList />
        </CardContent>
      </Card>
    </div>
  )
}
