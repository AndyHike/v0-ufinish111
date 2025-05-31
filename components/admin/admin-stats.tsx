"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smartphone, Tag, Users, FileText } from "lucide-react"

export function AdminStats() {
  // In a real app, this would fetch data from an API
  const stats = [
    {
      title: "Всього брендів",
      value: "12",
      icon: Tag,
      description: "Брендів у системі",
    },
    {
      title: "Всього моделей",
      value: "124",
      icon: Smartphone,
      description: "Моделей телефонів",
    },
    {
      title: "Всього описів",
      value: "87",
      icon: FileText,
      description: "Описів телефонів",
    },
    {
      title: "Всього користувачів",
      value: "342",
      icon: Users,
      description: "Зареєстрованих користувачів",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
