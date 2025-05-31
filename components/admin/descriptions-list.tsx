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
import { MoreHorizontal, Search } from "lucide-react"
import Image from "next/image"

export function DescriptionsList() {
  const [searchQuery, setSearchQuery] = useState("")

  // In a real app, this would fetch data from an API
  const descriptions = [
    {
      id: "1",
      model: "iPhone 13",
      brand: "Apple",
      brandLogo: "/bitten-fruit-silhouette.png",
      image: "/placeholder.svg?height=40&width=40&query=iphone 13",
      content: "6.1-inch Super Retina XDR display, A15 Bionic chip, 5G capable",
      createdAt: "10.03.2023",
    },
    {
      id: "2",
      model: "Galaxy S21",
      brand: "Samsung",
      brandLogo: "/samsung-wordmark.png",
      image: "/placeholder.svg?height=40&width=40&query=galaxy s21",
      content: "6.2-inch Dynamic AMOLED 2X, Exynos 2100, 5G capable",
      createdAt: "15.02.2023",
    },
    {
      id: "3",
      model: "Redmi Note 10",
      brand: "Xiaomi",
      brandLogo: "/xiaomi-logo-abstract.png",
      image: "/placeholder.svg?height=40&width=40&query=redmi note 10",
      content: "6.43-inch AMOLED, Snapdragon 678, 48MP quad camera",
      createdAt: "22.04.2023",
    },
    {
      id: "4",
      model: "P40 Pro",
      brand: "Huawei",
      brandLogo: "/abstract-petal-design.png",
      image: "/placeholder.svg?height=40&width=40&query=huawei p40 pro",
      content: "6.58-inch OLED, Kirin 990 5G, Leica quad camera",
      createdAt: "05.01.2023",
    },
    {
      id: "5",
      model: "9 Pro",
      brand: "OnePlus",
      brandLogo: "/placeholder.svg?height=40&width=40&query=oneplus logo",
      image: "/placeholder.svg?height=40&width=40&query=oneplus 9 pro",
      content: "6.7-inch Fluid AMOLED, Snapdragon 888, Hasselblad camera",
      createdAt: "18.05.2023",
    },
  ]

  const filteredDescriptions = descriptions.filter(
    (description) =>
      description.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук описів..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Модель</TableHead>
            <TableHead>Опис</TableHead>
            <TableHead>Дата створення</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDescriptions.map((description) => (
            <TableRow key={description.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-md">
                    <Image
                      src={description.image || "/placeholder.svg"}
                      alt={description.model}
                      width={32}
                      height={32}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{description.model}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="h-3 w-3 overflow-hidden rounded-full">
                        <Image
                          src={description.brandLogo || "/placeholder.svg"}
                          alt={description.brand}
                          width={12}
                          height={12}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      {description.brand}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate">{description.content}</TableCell>
              <TableCell>{description.createdAt}</TableCell>
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
                    <DropdownMenuItem>Переглянути деталі</DropdownMenuItem>
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
