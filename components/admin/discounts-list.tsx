"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search } from "lucide-react"

export function DiscountsList() {
  const [searchQuery, setSearchQuery] = useState("")

  // In a real app, this would fetch data from an API
  const discounts = [
    {
      id: "1",
      name: "Літня знижка",
      code: "SUMMER2023",
      amount: "15%",
      status: "Активна",
      validUntil: "31.08.2023",
      createdAt: "01.06.2023",
    },
    {
      id: "2",
      name: "Знижка для нових клієнтів",
      code: "NEWCLIENT",
      amount: "10%",
      status: "Активна",
      validUntil: "31.12.2023",
      createdAt: "15.01.2023",
    },
    {
      id: "3",
      name: "Знижка на ремонт екрану",
      code: "SCREEN2023",
      amount: "20%",
      status: "Неактивна",
      validUntil: "01.05.2023",
      createdAt: "01.03.2023",
    },
    {
      id: "4",
      name: "Знижка на заміну батареї",
      code: "BATTERY2023",
      amount: "15%",
      status: "Активна",
      validUntil: "31.10.2023",
      createdAt: "01.04.2023",
    },
    {
      id: "5",
      name: "Знижка для постійних клієнтів",
      code: "LOYAL2023",
      amount: "25%",
      status: "Активна",
      validUntil: "31.12.2023",
      createdAt: "01.01.2023",
    },
  ]

  const filteredDiscounts = discounts.filter(
    (discount) =>
      discount.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discount.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук знижок..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Назва</TableHead>
            <TableHead>Код</TableHead>
            <TableHead>Розмір</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Дійсна до</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDiscounts.map((discount) => (
            <TableRow key={discount.id}>
              <TableCell className="font-medium">{discount.name}</TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">{discount.code}</code>
              </TableCell>
              <TableCell>{discount.amount}</TableCell>
              <TableCell>
                <Badge variant={discount.status === "Активна" ? "default" : "secondary"}>{discount.status}</Badge>
              </TableCell>
              <TableCell>{discount.validUntil}</TableCell>
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
                    <DropdownMenuItem>Редагувати</DropdownMenuItem>
                    <DropdownMenuItem>{discount.status === "Активна" ? "Деактивувати" : "Активувати"}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Видалити</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
