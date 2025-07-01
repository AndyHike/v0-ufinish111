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
import Link from "next/link"

export function ModelsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // In a real app, this would fetch data from an API
  const models = [
    {
      id: "1",
      name: "iPhone 13",
      brand: "Apple",
      brandLogo: "/bitten-fruit-silhouette.png",
      image: "/sleek-slate-iphone.png",
      year: "2021",
      createdAt: "10.03.2023",
    },
    {
      id: "2",
      name: "Galaxy S21",
      brand: "Samsung",
      brandLogo: "/samsung-wordmark.png",
      image: "/phantom-violet-s21.png",
      year: "2021",
      createdAt: "15.02.2023",
    },
    {
      id: "3",
      name: "Redmi Note 10",
      brand: "Xiaomi",
      brandLogo: "/xiaomi-logo-abstract.png",
      image: "/redmi-note-10-on-desk.png",
      year: "2021",
      createdAt: "22.04.2023",
    },
    {
      id: "4",
      name: "P40 Pro",
      brand: "Huawei",
      brandLogo: "/abstract-petal-design.png",
      image: "/huawei-p40-pro-on-table.png",
      year: "2020",
      createdAt: "05.01.2023",
    },
    {
      id: "5",
      name: "9 Pro",
      brand: "OnePlus",
      brandLogo: "/abstract-red-white-lines.png",
      image: "/placeholder.svg?key=gt34u",
      year: "2021",
      createdAt: "18.05.2023",
    },
  ]

  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.brand.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
                <TableHead>Модель</TableHead>
                <TableHead>Бренд</TableHead>
                <TableHead>Рік випуску</TableHead>
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
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
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
            placeholder="Пошук моделей..."
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
            <TableHead>Бренд</TableHead>
            <TableHead>Рік випуску</TableHead>
            <TableHead>Дата створення</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredModels.map((model) => (
            <TableRow key={model.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-md">
                    <Image
                      src={model.image || "/placeholder.svg?height=32&width=32&query=phone model"}
                      alt={model.name}
                      width={32}
                      height={32}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="font-medium">{model.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 overflow-hidden rounded-full">
                    <Image
                      src={model.brandLogo || "/placeholder.svg?height=20&width=20&query=brand logo"}
                      alt={model.brand}
                      width={20}
                      height={20}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  </div>
                  {model.brand}
                </div>
              </TableCell>
              <TableCell>{model.year}</TableCell>
              <TableCell>{model.createdAt}</TableCell>
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
                    <DropdownMenuItem>Переглянути опис</DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/models/${model.id}/services`}>Керувати послугами</Link>
                    </DropdownMenuItem>
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
