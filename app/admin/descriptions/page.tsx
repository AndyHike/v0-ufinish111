import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DescriptionsList } from "@/components/admin/descriptions-list"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default function DescriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Описи телефонів</h1>
          <p className="text-muted-foreground">Керуйте описами телефонів та їх характеристиками.</p>
        </div>
        <Button asChild>
          <Link href="/admin/descriptions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Додати опис
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Всі описи</CardTitle>
          <CardDescription>Список всіх описів телефонів у вашій системі.</CardDescription>
        </CardHeader>
        <CardContent>
          <DescriptionsList />
        </CardContent>
      </Card>
    </div>
  )
}
