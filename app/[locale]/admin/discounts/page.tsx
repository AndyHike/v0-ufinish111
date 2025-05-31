"use client"

import type React from "react"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Plus, MoreHorizontal, Pencil, Trash2, Search } from "lucide-react"

// Mock data - in a real app, this would come from your API
const initialUsers = [
  { id: "1", name: "John Doe", email: "john.doe@example.com" },
  { id: "2", name: "Jane Smith", email: "jane.smith@example.com" },
  { id: "3", name: "Bob Johnson", email: "bob.johnson@example.com" },
  { id: "4", name: "Alice Brown", email: "alice.brown@example.com" },
]

const initialDiscounts = [
  { id: "1", userId: "1", code: "LOYAL10", percentage: 10, expiresAt: "2023-12-31" },
  { id: "2", userId: "2", code: "WELCOME15", percentage: 15, expiresAt: "2023-11-30" },
  { id: "3", userId: "3", code: "REPAIR20", percentage: 20, expiresAt: "2023-10-31" },
]

export default function DiscountsPage() {
  const t = useTranslations("AdminDiscounts")
  const { toast } = useToast()
  const [users] = useState(initialUsers)
  const [discounts, setDiscounts] = useState(initialDiscounts)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentDiscount, setCurrentDiscount] = useState<any>(null)
  const [formData, setFormData] = useState({
    userId: "",
    code: "",
    percentage: "",
    expiresAt: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredDiscounts = discounts.filter((discount) => {
    const user = users.find((u) => u.id === discount.userId)
    return (
      discount.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user && user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? user.name : "Unknown"
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newDiscount = {
        id: String(discounts.length + 1),
        userId: formData.userId,
        code: formData.code,
        percentage: Number.parseInt(formData.percentage),
        expiresAt: formData.expiresAt,
      }

      setDiscounts([...discounts, newDiscount])
      setFormData({ userId: "", code: "", percentage: "", expiresAt: "" })
      setIsAddDialogOpen(false)

      toast({
        title: t("discountAdded"),
        description: t("discountAddedDescription", { code: newDiscount.code }),
      })
    } catch (error) {
      console.error("Error adding discount:", error)
      toast({
        title: t("error"),
        description: t("errorAddingDiscount"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentDiscount) return

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedDiscounts = discounts.map((discount) =>
        discount.id === currentDiscount.id
          ? {
              ...discount,
              userId: formData.userId,
              code: formData.code,
              percentage: Number.parseInt(formData.percentage),
              expiresAt: formData.expiresAt,
            }
          : discount,
      )

      setDiscounts(updatedDiscounts)
      setIsEditDialogOpen(false)
      setCurrentDiscount(null)

      toast({
        title: t("discountUpdated"),
        description: t("discountUpdatedDescription", { code: formData.code }),
      })
    } catch (error) {
      console.error("Error updating discount:", error)
      toast({
        title: t("error"),
        description: t("errorUpdatingDiscount"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDiscount = async () => {
    if (!currentDiscount) return

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedDiscounts = discounts.filter((discount) => discount.id !== currentDiscount.id)

      setDiscounts(updatedDiscounts)
      setIsDeleteDialogOpen(false)
      setCurrentDiscount(null)

      toast({
        title: t("discountDeleted"),
        description: t("discountDeletedDescription", { code: currentDiscount.code }),
      })
    } catch (error) {
      console.error("Error deleting discount:", error)
      toast({
        title: t("error"),
        description: t("errorDeletingDiscount"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (discount: any) => {
    setCurrentDiscount(discount)
    setFormData({
      userId: discount.userId,
      code: discount.code,
      percentage: String(discount.percentage),
      expiresAt: discount.expiresAt,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (discount: any) => {
    setCurrentDiscount(discount)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("addDiscount")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addDiscountTitle")}</DialogTitle>
              <DialogDescription>{t("addDiscountDescription")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDiscount}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="user" className="text-sm font-medium">
                    {t("userLabel")}
                  </label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) => handleSelectChange("userId", value)}
                    required
                  >
                    <SelectTrigger id="user">
                      <SelectValue placeholder={t("selectUser")} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium">
                    {t("codeLabel")}
                  </label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder={t("codePlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="percentage" className="text-sm font-medium">
                    {t("percentageLabel")}
                  </label>
                  <Input
                    id="percentage"
                    name="percentage"
                    type="number"
                    value={formData.percentage}
                    onChange={handleInputChange}
                    placeholder={t("percentagePlaceholder")}
                    min="1"
                    max="100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="expiresAt" className="text-sm font-medium">
                    {t("expiresAtLabel")}
                  </label>
                  <Input
                    id="expiresAt"
                    name="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("adding") : t("add")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
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
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("user")}</TableHead>
              <TableHead>{t("percentage")}</TableHead>
              <TableHead>{t("expiresAt")}</TableHead>
              <TableHead className="w-[100px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDiscounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchQuery ? t("noSearchResults") : t("noDiscounts")}
                </TableCell>
              </TableRow>
            ) : (
              filteredDiscounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell className="font-medium">{discount.code}</TableCell>
                  <TableCell>{getUserName(discount.userId)}</TableCell>
                  <TableCell>{discount.percentage}%</TableCell>
                  <TableCell>{discount.expiresAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t("openMenu")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditDialog(discount)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => openDeleteDialog(discount)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("delete")}
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

      {/* Edit Discount Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editDiscountTitle")}</DialogTitle>
            <DialogDescription>{t("editDiscountDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditDiscount}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-user" className="text-sm font-medium">
                  {t("userLabel")}
                </label>
                <Select value={formData.userId} onValueChange={(value) => handleSelectChange("userId", value)} required>
                  <SelectTrigger id="edit-user">
                    <SelectValue placeholder={t("selectUser")} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-code" className="text-sm font-medium">
                  {t("codeLabel")}
                </label>
                <Input
                  id="edit-code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder={t("codePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-percentage" className="text-sm font-medium">
                  {t("percentageLabel")}
                </label>
                <Input
                  id="edit-percentage"
                  name="percentage"
                  type="number"
                  value={formData.percentage}
                  onChange={handleInputChange}
                  placeholder={t("percentagePlaceholder")}
                  min="1"
                  max="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-expiresAt" className="text-sm font-medium">
                  {t("expiresAtLabel")}
                </label>
                <Input
                  id="edit-expiresAt"
                  name="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("saving") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Discount Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteDiscountTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteDiscountDescription", { code: currentDiscount?.code || "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteDiscount} disabled={isSubmitting}>
              {isSubmitting ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
