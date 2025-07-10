"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { toast } from "sonner"

interface RemOnlineCategory {
  id: string
  category_id: number
  category_title: string
  description?: string
  created_at: string
  updated_at: string
}

export function RemOnlineCategoriesManager() {
  const [categories, setCategories] = useState<RemOnlineCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
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
      toast.error("ID категорії та назва обов'язкові")
      return
    }

    try {
      const url = editingId ? `/api/admin/remonline-categories/${editingId}` : "/api/admin/remonline-categories"

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingId ? "Категорію оновлено" : "Категорію створено")
        fetchCategories()
        resetForm()
      } else {
        const data = await response.json()
        toast.error(data.error || "Помилка збереження")
      }
    } catch (error) {
      console.error("Error saving category:", error)
      toast.error("Помилка збереження")
    }
  }

  const handleEdit = (category: RemOnlineCategory) => {
    setEditingId(category.id)
    setFormData({
      category_id: category.category_id.toString(),
      category_title: category.category_title,
      description: category.description || "",
    })
    setShowAddForm(true)
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

  const resetForm = () => {
    setFormData({
      category_id: "",
      category_title: "",
      description: "",
    })
    setEditingId(null)
    setShowAddForm(false)
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
          <CardTitle className="flex items-center justify-between">
            Категорії RemOnline
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
              <Plus className="h-4 w-4 mr-2" />
              Додати категорію
            </Button>
          </CardTitle>
          <CardDescription>Додайте категорії RemOnline для візуального розуміння та фільтрації послуг</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-4">{editingId ? "Редагувати категорію" : "Додати нову категорію"}</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category_id">ID категорії *</Label>
                    <Input
                      id="category_id"
                      type="number"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      placeholder="1575764"
                      disabled={!!editingId}
                      required
                    />
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
                </div>
                <div>
                  <Label htmlFor="description">Опис</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Опис категорії для кращого розуміння"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? "Оновити" : "Створити"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" />
                    Скасувати
                  </Button>
                </div>
              </form>
            </div>
          )}

          <Separator className="my-6" />

          {/* Categories List */}
          <div className="space-y-4">
            <h4 className="font-medium">Існуючі категорії ({categories.length})</h4>
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Категорії не знайдено. Додайте першу категорію для початку роботи.
              </p>
            ) : (
              <div className="grid gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="font-mono">
                        {category.category_id}
                      </Badge>
                      <div>
                        <h5 className="font-medium">{category.category_title}</h5>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(category.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
