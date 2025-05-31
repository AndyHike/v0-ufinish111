"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Pencil, Trash, AlertCircle } from "lucide-react"
import type { OrderStatus } from "@/lib/order-status-utils"
import { clearStatusCache } from "@/lib/order-status-utils"

// Color options for status badges
const colorOptions = [
  { value: "bg-blue-100 text-blue-800", label: "blue" },
  { value: "bg-green-100 text-green-800", label: "green" },
  { value: "bg-amber-100 text-amber-800", label: "amber" },
  { value: "bg-red-100 text-red-800", label: "red" },
  { value: "bg-purple-100 text-purple-800", label: "purple" },
  { value: "bg-pink-100 text-pink-800", label: "pink" },
  { value: "bg-indigo-100 text-indigo-800", label: "indigo" },
  { value: "bg-gray-100 text-gray-800", label: "gray" },
  { value: "bg-teal-100 text-teal-800", label: "teal" },
  { value: "bg-cyan-100 text-cyan-800", label: "cyan" },
  { value: "bg-orange-100 text-orange-800", label: "orange" },
  { value: "bg-lime-100 text-lime-800", label: "lime" },
  { value: "bg-green-700 text-white", label: "darkGreen" },
]

interface OrderStatusesListProps {
  forceAuth?: boolean
}

export function OrderStatusesList({ forceAuth = false }: OrderStatusesListProps) {
  const { data: session } = useSession()
  const t = useTranslations("Admin")

  // State for statuses list
  const [statuses, setStatuses] = useState<OrderStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)

  // Form state
  const [formState, setFormState] = useState({
    remonline_status_id: "",
    name_uk: "",
    name_en: "",
    name_cs: "",
    color: "bg-gray-100 text-gray-800",
  })

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch statuses on component mount
  useEffect(() => {
    fetchStatuses()
  }, [])

  // Function to fetch statuses from API
  async function fetchStatuses() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/order-statuses")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch statuses")
      }

      setStatuses(data.statuses)
    } catch (err) {
      console.error("Error fetching statuses:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Reset form to default values
  function resetForm() {
    setFormState({
      remonline_status_id: "",
      name_uk: "",
      name_en: "",
      name_cs: "",
      color: "bg-gray-100 text-gray-800",
    })
  }

  // Handle input changes
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  // Open edit dialog and populate form with status data
  function handleEditClick(status: OrderStatus) {
    setSelectedStatus(status)
    setFormState({
      remonline_status_id: status.remonline_status_id.toString(),
      name_uk: status.name_uk,
      name_en: status.name_en,
      name_cs: status.name_cs,
      color: status.color,
    })
    setEditDialogOpen(true)
  }

  // Open delete dialog
  function handleDeleteClick(status: OrderStatus) {
    setSelectedStatus(status)
    setDeleteDialogOpen(true)
  }

  // Add new status
  async function handleAddStatus(e: React.FormEvent) {
    e.preventDefault()

    try {
      setIsSubmitting(true)

      const userId = session?.user?.id || localStorage.getItem("userId") || "admin-user"

      const response = await fetch("/api/admin/order-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          remonline_status_id: Number.parseInt(formState.remonline_status_id, 10),
          userId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to add status")
      }

      // Очищаємо кеш статусів
      clearStatusCache()

      toast({
        title: t("statusAdded"),
        description: t("statusAddedDescription"),
      })

      resetForm()
      setAddDialogOpen(false)
      fetchStatuses()
    } catch (err) {
      console.error("Error adding status:", err)
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : t("failedToAddStatus"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update existing status
  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedStatus) {
      toast({
        title: t("error"),
        description: t("noStatusSelected"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const userId = session?.user?.id || localStorage.getItem("userId") || "admin-user"

      const response = await fetch(`/api/admin/order-statuses/${selectedStatus.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          remonline_status_id: Number(formState.remonline_status_id),
          userId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to update status")
      }

      // Очищаємо кеш статусів
      clearStatusCache()

      toast({
        title: t("statusUpdated"),
        description: t("statusUpdatedDescription"),
      })

      resetForm()
      setEditDialogOpen(false)
      fetchStatuses()
    } catch (err) {
      console.error("Error updating status:", err)
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : t("failedToUpdateStatus"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete status
  async function handleDeleteStatus() {
    if (!selectedStatus) {
      toast({
        title: t("error"),
        description: t("noStatusSelected"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const userId = session?.user?.id || localStorage.getItem("userId") || "admin-user"

      const response = await fetch(`/api/admin/order-statuses/${selectedStatus.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to delete status")
      }

      // Очищаємо кеш статусів
      clearStatusCache()

      toast({
        title: t("statusDeleted"),
        description: t("statusDeletedDescription"),
      })

      setDeleteDialogOpen(false)
      fetchStatuses()
    } catch (err) {
      console.error("Error deleting status:", err)
      toast({
        title: t("error"),
        description: err instanceof Error ? err.message : t("failedToDeleteStatus"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t("loadingOrderStatuses")}</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("loadingError")}</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchStatuses}>{t("tryAgain")}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">{t("orderStatuses")}</h2>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addStatus")}
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("remonlineCode")}</TableHead>
              <TableHead>{t("nameUk")}</TableHead>
              <TableHead>{t("nameEn")}</TableHead>
              <TableHead>{t("nameCs")}</TableHead>
              <TableHead>{t("color")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((status) => (
              <TableRow key={status.id}>
                <TableCell className="font-medium">{status.remonline_status_id}</TableCell>
                <TableCell>{status.name_uk}</TableCell>
                <TableCell>{status.name_en}</TableCell>
                <TableCell>{status.name_cs}</TableCell>
                <TableCell>
                  <Badge className={status.color}>{status.name_uk}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(status)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      {t("edit")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(status)}>
                      <Trash className="h-4 w-4 mr-1" />
                      {t("delete")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {statuses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("noOrderStatuses")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Status Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("addNewStatus")}</DialogTitle>
            <DialogDescription>{t("addNewStatusDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStatus}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="remonline_status_id" className="text-right">
                  {t("remonlineCode")}
                </Label>
                <Input
                  id="remonline_status_id"
                  name="remonline_status_id"
                  value={formState.remonline_status_id}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="3153189"
                  type="number"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name_uk" className="text-right">
                  {t("nameUk")}
                </Label>
                <Input
                  id="name_uk"
                  name="name_uk"
                  value={formState.name_uk}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder={t("newStatusPlaceholderUk")}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name_en" className="text-right">
                  {t("nameEn")}
                </Label>
                <Input
                  id="name_en"
                  name="name_en"
                  value={formState.name_en}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder={t("newStatusPlaceholderEn")}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name_cs" className="text-right">
                  {t("nameCs")}
                </Label>
                <Input
                  id="name_cs"
                  name="name_cs"
                  value={formState.name_cs}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder={t("newStatusPlaceholderCs")}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">
                  {t("color")}
                </Label>
                <div className="col-span-3 flex gap-2">
                  <select
                    id="color"
                    name="color"
                    value={formState.color}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(`colors.${option.label}`)}
                      </option>
                    ))}
                  </select>
                  <Badge className={formState.color}>{t("example")}</Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("adding")}
                  </>
                ) : (
                  t("add")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("editStatus")}</DialogTitle>
            <DialogDescription>{t("editStatusDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStatus}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_remonline_status_id" className="text-right">
                  {t("remonlineCode")}
                </Label>
                <Input
                  id="edit_remonline_status_id"
                  name="remonline_status_id"
                  value={formState.remonline_status_id}
                  onChange={handleInputChange}
                  className="col-span-3"
                  type="number"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_name_uk" className="text-right">
                  {t("nameUk")}
                </Label>
                <Input
                  id="edit_name_uk"
                  name="name_uk"
                  value={formState.name_uk}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_name_en" className="text-right">
                  {t("nameEn")}
                </Label>
                <Input
                  id="edit_name_en"
                  name="name_en"
                  value={formState.name_en}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_name_cs" className="text-right">
                  {t("nameCs")}
                </Label>
                <Input
                  id="edit_name_cs"
                  name="name_cs"
                  value={formState.name_cs}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_color" className="text-right">
                  {t("color")}
                </Label>
                <div className="col-span-3 flex gap-2">
                  <select
                    id="edit_color"
                    name="color"
                    value={formState.color}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    {colorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(`colors.${option.label}`)}
                      </option>
                    ))}
                  </select>
                  <Badge className={formState.color}>{t("example")}</Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("save")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Status Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("deleteStatus")}</DialogTitle>
            <DialogDescription>
              {t("deleteStatusConfirmation", { status: selectedStatus?.name_uk || selectedStatus?.name_en || "" })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteStatus} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                t("delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
