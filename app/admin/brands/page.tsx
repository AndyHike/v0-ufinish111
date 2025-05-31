import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandsList } from "@/components/admin/brands-list"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Бренди телефонів</h1>
          <p className="text-muted-foreground">Керуйте брендами телефонів, які ви ремонтуєте.</p>
        </div>
        <Button asChild>
          <Link href="/admin/brands/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Додати бренд
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Всі бренди</CardTitle>
          <CardDescription>Список всіх брендів телефонів у вашій системі.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandsList />
        </CardContent>
      </Card>
    </div>
  )
}
