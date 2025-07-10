"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Tag, Info } from "lucide-react"
import { toast } from "sonner"

interface RemOnlineCategory {
  id: string
  category_id: number
  category_title: string
  description?: string
  created_at: string
}

export function RemOnlineCategoriesManager() {
  const [categories, setCategories] = useState<RemOnlineCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<RemOnlineCategory | null>(null)

  const [formData, setFormData] = useState({
    category_id: "",
    category_title: "",
    description: "",
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/remonline-categories")
      const data = await response.json()

      if (response.ok) {
        setCategories(data.categories || [])
      } else {
        toast.error("Помилка завантаження категорій")
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Помилка завантаження категорій")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category_id || !formData.category_title) {
      toast.error("Заповніть обов'язкові поля")
      return
    }

    try {
      const url = editingCategory
        ? `/api/admin/remonline-categories/${editingCategory.id}`
        : "/api/admin/remonline-categories"

      const method = editingCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingCategory ? "Категорію оновлено" : "Категорію створено")
        setIsDialogOpen(false)
        setEditingCategory(null)
        setFormData({
          category_id: "",
          category_title: "",
          description: "",
        })
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || "Помилка збереження")
      }
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error("Помилка збереження")
    }
  }

  const handleEdit = (category: RemOnlineCategory) => {
    setEditingCategory(category)
    setFormData({
      category_id: category.category_id.toString(),
      category_title: category.category_title,
      description: category.description || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цю категорію?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/remonline-categories/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Категорію видалено")
        fetchCategories()
      } else {
        toast.error("Помилка видалення")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Помилка видалення")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Завантаження...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Категорії RemOnline
              </CardTitle>
              <CardDescription>
                Додайте категорії RemOnline для візуального розуміння та фільтрації при синхронізації
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingCategory(null)
                    setFormData({
                      category_id: "",
                      category_title: "",
                      description: "",
                    })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Додати категорію
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Редагувати категорію" : "Додати категорію"}</DialogTitle>
                  <DialogDescription>
                    Додайте категорію RemOnline для кращого розуміння та організації синхронізації
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category_id">ID категорії RemOnline *</Label>
                    <Input
                      id="category_id"
                      type="number"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      placeholder="1575764"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Знайдіть ID категорії в RemOnline API або інтерфейсі
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="category_title">Назва категорії *</Label>
                    <Input
                      id="category_title"
                      value={formData.category_title}
                      onChange={(e) => setFormData({ ...formData, category_title: e.target.value })}
                      placeholder="iPhone"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Опис (необов'язково)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Всі послуги для iPhone..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Скасувати
                    </Button>
                    <Button type="submit">{editingCategory ? "Оновити" : "Створити"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Як це працює:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Додайте категорії RemOnline для візуального розуміння (наприклад: 1575764 → iPhone)</li>
                  <li>При синхронізації ви зможете обрати конкретні категорії або синхронізувати всі</li>
                  <li>Система автоматично створить бренди, серії та моделі на основі barcode послуг</li>
                </ul>
              </div>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Категорії не знайдено. Додайте першу категорію для кращої організації.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID категорії</TableHead>
                  <TableHead>Назва</TableHead>
                  <TableHead>Опис</TableHead>
                  <TableHead>Створено</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {category.category_id}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{category.category_title}</TableCell>
                    <TableCell className="text-muted-foreground">{category.description || "Без опису"}</TableCell>
                    <TableCell>{new Date(category.created_at).toLocaleDateString("uk-UA")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
