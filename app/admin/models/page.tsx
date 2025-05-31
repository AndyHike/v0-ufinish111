import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModelsList } from "@/components/admin/models-list"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default function ModelsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Моделі телефонів</h1>
          <p className="text-muted-foreground">Керуйте моделями телефонів, які ви ремонтуєте.</p>
        </div>
        <Button asChild>
          <Link href="/admin/models/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Додати модель
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Всі моделі</CardTitle>
          <CardDescription>Список всіх моделей телефонів у вашій системі.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModelsList />
        </CardContent>
      </Card>
    </div>
  )
}
