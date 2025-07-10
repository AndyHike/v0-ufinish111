"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Trash2, Edit, Plus, Link } from "lucide-react"
import { toast } from "sonner"

interface Brand {
  id: string
  name: string
  slug: string
}

interface Series {
  id: string
  name: string
  slug: string
}

interface RemOnlineCategory {
  id: string
  category_id: number
  category_title: string
  association_type: "brand" | "series"
  target_id: string
  created_at: string
  brands?: Brand
  series?: Series
}

export function RemOnlineCategoriesManager() {
  const [categories, setCategories] = useState<RemOnlineCategory[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<RemOnlineCategory | null>(null)

  const [formData, setFormData] = useState({
    category_id: "",
    category_title: "",
    association_type: "brand" as "brand" | "series",
    target_id: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch categories
      const categoriesRes = await fetch("/api/admin/remonline-categories")
      const categoriesData = await categoriesRes.json()

      // Fetch brands
      const brandsRes = await fetch("/api/admin/brands")
      const brandsData = await brandsRes.json()

      // Fetch series
      const seriesRes = await fetch("/api/admin/series")
      const seriesData = await seriesRes.json()

      if (categoriesRes.ok) {
        setCategories(categoriesData.categories || [])
      }

      if (brandsRes.ok) {
        setBrands(brandsData.brands || [])
      }

      if (seriesRes.ok) {
        setSeries(seriesData.series || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Помилка завантаження даних")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category_id || !formData.category_title || !formData.target_id) {
      toast.error("Заповніть всі обов'язкові поля")
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
        toast.success(editingCategory ? "Асоціацію оновлено" : "Асоціацію створено")
        setIsDialogOpen(false)
        setEditingCategory(null)
        setFormData({
          category_id: "",
          category_title: "",
          association_type: "brand",
          target_id: "",
        })
        fetchData()
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
      association_type: category.association_type,
      target_id: category.target_id,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цю асоціацію?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/remonline-categories/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Асоціацію видалено")
        fetchData()
      } else {
        toast.error("Помилка видалення")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Помилка видалення")
    }
  }

  const getTargetOptions = () => {
    return formData.association_type === "brand" ? brands : series
  }

  const getTargetName = (category: RemOnlineCategory) => {
    if (category.association_type === "brand" && category.brands) {
      return category.brands.name
    }
    if (category.association_type === "series" && category.series) {
      return category.series.name
    }
    return "Невідомо"
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
                <Link className="h-5 w-5" />
                Асоціації категорій RemOnline
              </CardTitle>
              <CardDescription>Налаштуйте відповідність між категоріями RemOnline та брендами/серіями</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingCategory(null)
                    setFormData({
                      category_id: "",
                      category_title: "",
                      association_type: "brand",
                      target_id: "",
                    })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Додати асоціацію
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Редагувати асоціацію" : "Додати асоціацію"}</DialogTitle>
                  <DialogDescription>Створіть зв'язок між категорією RemOnline та брендом або серією</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category_id">ID категорії RemOnline</Label>
                    <Input
                      id="category_id"
                      type="number"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      placeholder="1575764"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category_title">Назва категорії</Label>
                    <Input
                      id="category_title"
                      value={formData.category_title}
                      onChange={(e) => setFormData({ ...formData, category_title: e.target.value })}
                      placeholder="iPhone"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="association_type">Тип асоціації</Label>
                    <Select
                      value={formData.association_type}
                      onValueChange={(value: "brand" | "series") =>
                        setFormData({ ...formData, association_type: value, target_id: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brand">Бренд</SelectItem>
                        <SelectItem value="series">Серія</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="target_id">{formData.association_type === "brand" ? "Бренд" : "Серія"}</Label>
                    <Select
                      value={formData.target_id}
                      onValueChange={(value) => setFormData({ ...formData, target_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={`Оберіть ${formData.association_type === "brand" ? "бренд" : "серію"}`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {getTargetOptions().map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Асоціації категорій не знайдено. Додайте першу асоціацію.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID категорії</TableHead>
                  <TableHead>Назва категорії</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Пов'язано з</TableHead>
                  <TableHead>Створено</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono">{category.category_id}</TableCell>
                    <TableCell>{category.category_title}</TableCell>
                    <TableCell>
                      <Badge variant={category.association_type === "brand" ? "default" : "secondary"}>
                        {category.association_type === "brand" ? "Бренд" : "Серія"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getTargetName(category)}</TableCell>
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
