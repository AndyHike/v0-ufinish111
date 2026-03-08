"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { type User } from "./users-management"

interface CreateUserFormProps {
    onSuccess: () => void
    onCancel: () => void
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
    const [formData, setFormData] = useState({
        email: "",
        first_name: "",
        last_name: "",
        role: "user",
        phone: "",
        password: "",
    })
    const [formErrors, setFormErrors] = useState({
        email: "",
        password: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

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
                title: "Success",
                description: "User created successfully",
            })
            onSuccess()
        } catch (error) {
            console.error("Error creating user:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create user",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
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
                        placeholder="+380XXXXXXXXX"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="role">Роль</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Виберіть роль" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">Користувач</SelectItem>
                            <SelectItem value="admin">Адміністратор</SelectItem>
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
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
                <Button className="mt-2 sm:mt-0" type="button" variant="outline" onClick={onCancel}>
                    Скасувати
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Створити
                </Button>
            </div>
        </form>
    )
}

interface EditUserFormProps {
    user: User
    onSuccess: () => void
    onCancel: () => void
}

export function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
    const [formData, setFormData] = useState({
        email: user.email,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        role: user.role,
        phone: user.phone || "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    role: formData.role,
                    phone: formData.phone,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to update user")
            }

            toast({
                title: "Success",
                description: "User updated successfully",
            })
            onSuccess()
        } catch (error) {
            console.error("Error updating user:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update user",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
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
                        placeholder="+380XXXXXXXXX"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit_role">Роль</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger id="edit_role">
                            <SelectValue placeholder="Виберіть роль" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">Користувач</SelectItem>
                            <SelectItem value="admin">Адміністратор</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
                <Button className="mt-2 sm:mt-0" type="button" variant="outline" onClick={onCancel}>
                    Скасувати
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Зберегти
                </Button>
            </div>
        </form>
    )
}
