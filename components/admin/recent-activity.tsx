"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RecentActivity() {
  // In a real app, this would fetch data from an API
  const activities = [
    {
      user: {
        name: "Олександр П.",
        email: "alex@example.com",
        avatar: "/placeholder.svg?height=40&width=40&query=user",
      },
      action: "створив новий бренд",
      target: "Samsung",
      time: "2 години тому",
    },
    {
      user: {
        name: "Марія К.",
        email: "maria@example.com",
        avatar: "/placeholder.svg?height=40&width=40&query=user",
      },
      action: "оновила модель",
      target: "iPhone 13",
      time: "5 годин тому",
    },
    {
      user: {
        name: "Іван С.",
        email: "ivan@example.com",
        avatar: "/placeholder.svg?height=40&width=40&query=user",
      },
      action: "видалив опис",
      target: "Xiaomi Redmi Note 10",
      time: "1 день тому",
    },
    {
      user: {
        name: "Наталія В.",
        email: "natalia@example.com",
        avatar: "/placeholder.svg?height=40&width=40&query=user",
      },
      action: "додала знижку",
      target: "Літня знижка 15%",
      time: "2 дні тому",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Остання активність</CardTitle>
        <CardDescription>Останні дії адміністраторів у системі.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                <AvatarFallback>
                  {activity.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.action} <span className="font-medium">{activity.target}</span>
                </p>
              </div>
              <div className="ml-auto text-xs text-muted-foreground">{activity.time}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
