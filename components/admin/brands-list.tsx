"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
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

export function BrandsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // In a real app, this would fetch data from an API
  const brands = [
    {
      id: "1",
      name: "Apple",
      logo: "/bitten-fruit-silhouette.png",
      models: 24,
      createdAt: "10.03.2023",
    },
    {
      id: "2",
      name: "Samsung",
      logo: "/samsung-wordmark.png",
      models: 36,
      createdAt: "15.02.2023",
    },
    {
      id: "3",
      name: "Xiaomi",
      logo: "/xiaomi-logo-abstract.png",
      models: 18,
      createdAt: "22.04.2023",
    },
    {
      id: "4",
      name: "Huawei",
      logo: "/abstract-petal-design.png",
      models: 12,
      createdAt: "05.01.2023",
    },
    {
      id: "5",
      name: "OnePlus",
      logo: "/placeholder.svg?key=gppxq",
      models: 8,
      createdAt: "18.05.2023",
    },
  ]

  const filteredBrands = brands.filter((brand) => brand.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Бренд</TableHead>
                <TableHead>Кількість моделей</TableHead>
                <TableHead>Дата створення</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук брендів..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Бренд</TableHead>
            <TableHead>Кількість моделей</TableHead>
            <TableHead>Дата створення</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBrands.map((brand) => (
            <TableRow key={brand.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-md">
                    <Image
                      src={brand.logo || "/placeholder.svg?height=32&width=32&query=brand"}
                      alt={brand.name}
                      width={32}
                      height={32}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="font-medium">{brand.name}</span>
                </div>
              </TableCell>
              <TableCell>{brand.models}</TableCell>
              <TableCell>{brand.createdAt}</TableCell>
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
                    <DropdownMenuItem>Переглянути моделі</DropdownMenuItem>
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
