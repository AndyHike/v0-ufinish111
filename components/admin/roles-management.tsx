"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, MoreHorizontal, Pencil, Plus, Shield, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Role {
    id: string
    name: string
    slug: string
    is_default: boolean
    auto_approve: boolean
    discount_percentage: number
    description: string | null
    created_at: string
    updated_at: string
}

const emptyFormData = {
    name: "",
    slug: "",
    is_default: false,
    auto_approve: true,
    discount_percentage: 0,
    description: "",
}

export function RolesManagement() {
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [formData, setFormData] = useState(emptyFormData)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchRoles = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/admin/roles")
            if (!response.ok) throw new Error("Failed to fetch roles")
            const data = await response.json()
            setRoles(data)
        } catch (error) {
            console.error("Error fetching roles:", error)
            toast({
                title: "Помилка",
                description: "Не вдалося завантажити ролі",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch("/api/admin/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to create role")

            toast({ title: "Успіх", description: "Роль створено успішно" })
            setIsCreateDialogOpen(false)
            setFormData(emptyFormData)
            fetchRoles()
        } catch (error) {
            console.error("Error creating role:", error)
            toast({
                title: "Помилка",
                description: error instanceof Error ? error.message : "Не вдалося створити роль",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRole) return
        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to update role")

            toast({ title: "Успіх", description: "Роль оновлено успішно" })
            setIsEditDialogOpen(false)
            setSelectedRole(null)
            fetchRoles()
        } catch (error) {
            console.error("Error updating role:", error)
            toast({
                title: "Помилка",
                description: error instanceof Error ? error.message : "Не вдалося оновити роль",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedRole) return
        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
                method: "DELETE",
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to delete role")

            toast({ title: "Успіх", description: "Роль видалено успішно" })
            setIsDeleteDialogOpen(false)
            setSelectedRole(null)
            fetchRoles()
        } catch (error) {
            console.error("Error deleting role:", error)
            toast({
                title: "Помилка",
                description: error instanceof Error ? error.message : "Не вдалося видалити роль",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const openEditDialog = (role: Role) => {
        setSelectedRole(role)
        setFormData({
            name: role.name,
            slug: role.slug,
            is_default: role.is_default,
            auto_approve: role.auto_approve,
            discount_percentage: role.discount_percentage,
            description: role.description || "",
        })
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (role: Role) => {
        setSelectedRole(role)
        setIsDeleteDialogOpen(true)
    }

    const autoGenerateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9а-яіїєґ\s-]/gi, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 50)
    }

    const RoleFormFields = ({ isEdit = false }: { isEdit?: boolean }) => (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Назва ролі *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                            const name = e.target.value
                            setFormData({
                                ...formData,
                                name,
                                slug: isEdit ? formData.slug : autoGenerateSlug(name),
                            })
                        }}
                        placeholder="B2B Клієнт"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="b2b"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Опис ролі..."
                    rows={2}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="discount_percentage">Постійна знижка (%)</Label>
                <Input
                    id="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.discount_percentage}
                    onChange={(e) =>
                        setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                    Знижка, яка автоматично застосовується до всіх замовлень користувачів з цією роллю
                </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                    <Label htmlFor="is_default">Дефолтна роль</Label>
                    <p className="text-xs text-muted-foreground">
                        Ця роль буде призначена новим користувачам за замовчуванням
                    </p>
                </div>
                <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                    <Label htmlFor="auto_approve">Автоматичне підтвердження</Label>
                    <p className="text-xs text-muted-foreground">
                        Реєстрація підтверджується автоматично без участі адміністратора
                    </p>
                </div>
                <Switch
                    id="auto_approve"
                    checked={formData.auto_approve}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_approve: checked })}
                />
            </div>
        </div>
    )

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold">Ролі користувачів</CardTitle>
                    <Button
                        onClick={() => {
                            setFormData(emptyFormData)
                            setIsCreateDialogOpen(true)
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Додати роль
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Назва</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Дефолтна</TableHead>
                                        <TableHead>Автопідтвердження</TableHead>
                                        <TableHead>Знижка</TableHead>
                                        <TableHead className="w-[50px]" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Ролей не знайдено
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        roles.map((role) => (
                                            <TableRow key={role.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                                        {role.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                                                        {role.slug}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    {role.is_default && (
                                                        <Badge variant="default" className="bg-blue-600">
                                                            Дефолтна
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={role.auto_approve ? "default" : "secondary"}>
                                                        {role.auto_approve ? "Так" : "Потребує підтвердження"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {role.discount_percentage > 0 ? (
                                                        <Badge variant="outline" className="text-green-700 border-green-300">
                                                            {role.discount_percentage}%
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">—</span>
                                                    )}
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
                                                            <DropdownMenuItem onClick={() => openEditDialog(role)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Редагувати
                                                            </DropdownMenuItem>
                                                            {!role.is_default && (
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => openDeleteDialog(role)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Видалити
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Role Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Створити нову роль</DialogTitle>
                        <DialogDescription>
                            Створіть нову роль для користувачів. Ви можете налаштувати автопідтвердження та знижку.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <RoleFormFields />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Створити
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Редагувати роль</DialogTitle>
                        <DialogDescription>Оновіть налаштування ролі.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <RoleFormFields isEdit />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Скасувати
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Зберегти
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Role Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Видалити роль</DialogTitle>
                        <DialogDescription>
                            Ви впевнені, що хочете видалити роль «{selectedRole?.name}»? Ця дія не може бути
                            скасована.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Скасувати
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Trash2 className="mr-2 h-4 w-4" />
                            Видалити
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
