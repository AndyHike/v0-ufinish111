"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search } from "lucide-react"

export function UsersList() {
  const [searchQuery, setSearchQuery] = useState("")

  // In a real app, this would fetch data from an API
  const users = [
    {
      id: "1",
      first_name: "Олександр",
      last_name: "Петренко",
      email: "alex@example.com",
      role: "Користувач",
      status: "Активний",
      avatar: "/vibrant-street-market.png",
    },
    {
      id: "2",
      first_name: "Марія",
      last_name: "Ковальчук",
      email: "maria@example.com",
      role: "Адміністратор",
      status: "Активний",
      avatar: "/vibrant-street-market.png",
    },
    {
      id: "3",
      first_name: "Іван",
      last_name: "Сидоренко",
      email: "ivan@example.com",
      role: "Користувач",
      status: "Неактивний",
      avatar: "/vibrant-street-market.png",
    },
    {
      id: "4",
      first_name: "Наталія",
      last_name: "Василенко",
      email: "natalia@example.com",
      role: "Користувач",
      status: "Активний",
      avatar: "/vibrant-street-market.png",
    },
    {
      id: "5",
      first_name: "Сергій",
      last_name: "Мельник",
      email: "sergey@example.com",
      role: "Користувач",
      status: "Активний",
      avatar: "/vibrant-street-market.png",
    },
  ]

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Пошук користувачів..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Користувач</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatar || "/placeholder.svg"}
                        alt={`${user.first_name} ${user.last_name}`}
                      />
                      <AvatarFallback>
                        {user.first_name.charAt(0)}
                        {user.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div
                      className={`mr-2 h-2 w-2 rounded-full ${
                        user.status === "Активний" ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    {user.status}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Меню</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Дії</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Переглянути профіль</DropdownMenuItem>
                      <DropdownMenuItem>Редагувати</DropdownMenuItem>
                      <DropdownMenuItem>Змінити роль</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Видалити</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
