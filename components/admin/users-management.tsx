"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, MoreHorizontal, Search, Trash2, UserPlus, CheckCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { formatPhoneNumber } from "@/utils/format-phone"

interface Role {
  id: string
  name: string
  slug: string
}

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  role: string
  role_id: string | null
  role_name: string | null
  ico: string | null
  dic: string | null
  is_b2b: boolean
  is_approved: boolean
  phone: string | null
  avatar_url: string | null
  created_at: string
}

export function UsersManagement() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "user",
    role_id: "",
    phone: "",
    password: "",
    ico: "",
    dic: "",
    is_b2b: false,
  })
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/admin/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (searchQuery) queryParams.set("query", searchQuery)
      if (roleFilter && roleFilter !== "all") queryParams.set("role", roleFilter)
      queryParams.set("page", page.toString())
      queryParams.set("limit", "10")

      const response = await fetch(`/api/admin/users?${queryParams.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch users")

      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [searchQuery, roleFilter, page])

  const handleApproveUser = async (userId: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: true }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to approve user")
      }

      toast({
        title: "Успіх",
        description: "Користувача підтверджено",
      })
      fetchUsers()
    } catch (error) {
      console.error("Error approving user:", error)
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося підтвердити користувача",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormErrors({ email: "", password: "" })

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details?.includes("email")) {
          setFormErrors((prev) => ({ ...prev, email: "Email already exists or is invalid" }))
        }
        if (data.details?.includes("password")) {
          setFormErrors((prev) => ({
            ...prev,
            password: "Password must be at least 6 characters",
          }))
        }
        throw new Error(data.error || "Failed to create user")
      }

      toast({
        title: "Успіх",
        description: "Користувача створено",
      })
      setIsCreateDialogOpen(false)
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        role: "user",
        role_id: "",
        phone: "",
        password: "",
        ico: "",
        dic: "",
        is_b2b: false,
      })
      fetchUsers()
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося створити користувача",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          role_id: formData.role_id || null,
          phone: formData.phone,
          ico: formData.ico || null,
          dic: formData.dic || null,
          is_b2b: formData.is_b2b,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update user")
      }

      toast({
        title: "Успіх",
        description: "Користувача оновлено",
      })
      setIsEditDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося оновити користувача",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete user")
      }

      toast({
        title: "Успіх",
        description: "Користувача видалено",
      })
      setIsDeleteDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося видалити користувача",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role,
      role_id: user.role_id || "",
      phone: user.phone || "",
      password: "",
      ico: user.ico || "",
      dic: user.dic || "",
      is_b2b: user.is_b2b,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getRoleLabel = (user: User) => {
    if (user.role_name) return user.role_name
    if (user.role === "admin") return "Адміністратор"
    return "Користувач"
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Користувачі</CardTitle>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Додати користувача
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-x-2 md:space-y-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Пошук користувачів..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={roleFilter || ""}
                onValueChange={(value) => {
                  setRoleFilter(value || null)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Всі ролі" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі ролі</SelectItem>
                  <SelectItem value="admin">Адміністратор</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.slug}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Користувач</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="hidden md:table-cell">Телефон</TableHead>
                      <TableHead className="hidden lg:table-cell">IČO</TableHead>
                      <TableHead className="hidden md:table-cell">Дата реєстрації</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Користувачів не знайдено
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={
                                    user.avatar_url ||
                                    `/placeholder.svg?height=32&width=32&query=${encodeURIComponent(
                                      user.full_name || user.email,
                                    )}`
                                  }
                                  alt={user.full_name || user.email}
                                />
                                <AvatarFallback>
                                  {user.first_name && user.last_name
                                    ? `${user.first_name[0]}${user.last_name[0]}`
                                    : user.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-medium">{user.full_name || "Не вказано"}</p>
                                  {user.is_b2b && (
                                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                      B2B
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono select-all">
                              {user.id}
                            </code>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : user.is_b2b
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {getRoleLabel(user)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user.is_approved ? (
                              <Badge variant="default" className="bg-green-600">
                                Підтверджено
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                Очікує підтвердження
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {user.phone ? formatPhoneNumber(user.phone) : "Не вказано"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {user.ico || "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(user.created_at)}</TableCell>
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
                                {!user.is_approved && (
                                  <DropdownMenuItem
                                    onClick={() => handleApproveUser(user.id)}
                                    disabled={isSubmitting}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                    Підтвердити
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => openEditDialog(user)}>Редагувати</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(user)}>
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

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    Попередня
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Сторінка {page} з {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    Наступна
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Додати нового користувача</DialogTitle>
            <DialogDescription>
              Створіть новий обліковий запис користувача.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Ім'я</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Прізвище</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+420XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => {
                    const selectedRole = roles.find((r) => r.slug === value)
                    setFormData({
                      ...formData,
                      role: value,
                      role_id: selectedRole?.id || "",
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Виберіть роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Адміністратор</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.slug}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                {formErrors.password && <p className="text-sm text-destructive">{formErrors.password}</p>}
              </div>
            </div>
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редагувати користувача</DialogTitle>
            <DialogDescription>Оновіть інформацію про користувача.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">Ім'я</Label>
                  <Input
                    id="edit_first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">Прізвище</Label>
                  <Input
                    id="edit_last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Телефон</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+420XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_role">Роль</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => {
                    const selectedRole = roles.find((r) => r.slug === value)
                    setFormData({
                      ...formData,
                      role: value,
                      role_id: selectedRole?.id || "",
                    })
                  }}
                >
                  <SelectTrigger id="edit_role">
                    <SelectValue placeholder="Виберіть роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Адміністратор</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.slug}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* B2B fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_ico">IČO</Label>
                  <Input
                    id="edit_ico"
                    value={formData.ico}
                    onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_dic">DIČ</Label>
                  <Input
                    id="edit_dic"
                    value={formData.dic}
                    onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
                    placeholder="CZ12345678"
                  />
                </div>
              </div>
            </div>
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

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Видалити користувача</DialogTitle>
            <DialogDescription>
              Ви впевнені, що хочете видалити цього користувача? Ця дія не може бути скасована.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={
                      selectedUser.avatar_url ||
                      `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(
                        selectedUser.full_name || selectedUser.email,
                      )}`
                    }
                    alt={selectedUser.full_name || selectedUser.email}
                  />
                  <AvatarFallback>
                    {selectedUser.first_name && selectedUser.last_name
                      ? `${selectedUser.first_name[0]}${selectedUser.last_name[0]}`
                      : selectedUser.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.full_name || "Не вказано"}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Скасувати
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
