"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Plus, MoreHorizontal, Pencil, Trash2, Search } from "lucide-react"
import { DiscountForm } from "@/components/admin/discount-form"
import type { Discount } from "@/lib/discounts/types"

export default function DiscountsPage() {
  const t = useTranslations("AdminDiscounts")
  const { toast } = useToast()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentDiscount, setCurrentDiscount] = useState<Discount | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchDiscounts()
  }, [])

  async function fetchDiscounts() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/discounts")
      if (!response.ok) throw new Error("Failed to fetch discounts")
      const data = await response.json()
      setDiscounts(data)
    } catch (error) {
      console.error("Error fetching discounts:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити знижки",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleAddDiscount(data: any) {
    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to create discount")

      await fetchDiscounts()
      setIsAddDialogOpen(false)
      toast({
        title: "Успіх",
        description: "Знижку створено успішно",
      })
    } catch (error) {
      console.error("Error creating discount:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося створити знижку",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditDiscount(data: any) {
    if (!currentDiscount) return
    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/discounts/${currentDiscount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update discount")

      await fetchDiscounts()
      setIsEditDialogOpen(false)
      setCurrentDiscount(null)
      toast({
        title: "Успіх",
        description: "Знижку оновлено успішно",
      })
    } catch (error) {
      console.error("Error updating discount:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося оновити знижку",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteDiscount() {
    if (!currentDiscount) return
    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/discounts/${currentDiscount.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete discount")

      await fetchDiscounts()
      setIsDeleteDialogOpen(false)
      setCurrentDiscount(null)
      toast({
        title: "Успіх",
        description: "Знижку видалено успішно",
      })
    } catch (error) {
      console.error("Error deleting discount:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося видалити знижку",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  function getScopeLabel(discount: Discount): string {
    switch (discount.scopeType) {
      case "all_services":
        return "Всі послуги"
      case "all_models":
        return "Всі моделі"
      case "service":
        return "Послуга"
      case "brand":
        return "Бренд"
      case "series":
        return "Серія"
      case "model":
        return "Модель"
      default:
        return discount.scopeType
    }
  }

  function getDiscountLabel(discount: Discount): string {
    if (discount.discountType === "percentage") {
      return `${discount.discountValue}%`
    }
    return `${discount.discountValue} CZK`
  }

  const filteredDiscounts = discounts.filter(
    (discount) =>
      discount.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discount.code.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Знижки</h1>
          <p className="text-muted-foreground">Керування знижками на послуги</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Додати знижку
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Назва</TableHead>
              <TableHead>Код</TableHead>
              <TableHead>Знижка</TableHead>
              <TableHead>Застосування</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дійсна до</TableHead>
              <TableHead>Використано</TableHead>
              <TableHead className="w-[100px]">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Завантаження...
                </TableCell>
              </TableRow>
            ) : filteredDiscounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {searchQuery ? "Нічого не знайдено" : "Немає знижок"}
                </TableCell>
              </TableRow>
            ) : (
              filteredDiscounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">{discount.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{discount.code}</code>
                  </TableCell>
                  <TableCell>{getDiscountLabel(discount)}</TableCell>
                  <TableCell>{getScopeLabel(discount)}</TableCell>
                  <TableCell>
                    <Badge variant={discount.isActive ? "default" : "secondary"}>
                      {discount.isActive ? "Активна" : "Неактивна"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {discount.expiresAt ? new Date(discount.expiresAt).toLocaleDateString("uk") : "Без обмежень"}
                  </TableCell>
                  <TableCell>
                    {discount.currentUses}
                    {discount.maxUses && ` / ${discount.maxUses}`}
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
                        <DropdownMenuItem
                          onClick={() => {
                            setCurrentDiscount(discount)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Редагувати
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setCurrentDiscount(discount)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Видалити
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Додати нову знижку</DialogTitle>
            <DialogDescription>Створіть нову знижку для послуг або пристроїв</DialogDescription>
          </DialogHeader>
          <DiscountForm
            onSubmit={handleAddDiscount}
            onCancel={() => setIsAddDialogOpen(false)}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редагувати знижку</DialogTitle>
            <DialogDescription>Оновіть параметри знижки</DialogDescription>
          </DialogHeader>
          {currentDiscount && (
            <DiscountForm
              initialData={currentDiscount}
              onSubmit={handleEditDiscount}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setCurrentDiscount(null)
              }}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити знижку?</DialogTitle>
            <DialogDescription>
              Ви впевнені, що хочете видалити знижку "{currentDiscount?.name}"? Цю дію не можна скасувати.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={submitting}>
              Скасувати
            </Button>
            <Button variant="destructive" onClick={handleDeleteDiscount} disabled={submitting}>
              {submitting ? "Видалення..." : "Видалити"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
