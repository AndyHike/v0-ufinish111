"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Pencil, Trash, MoveVertical, MoreHorizontal, ArrowUp, ArrowDown } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

type Brand = {
  id: string
  name: string
}

type Series = {
  id: string
  name: string
  brand_id: string
  position: number
  created_at: string
  brands: {
    name: string
  }
}

interface SeriesListProps {
  brandId?: string
}

export function SeriesList({ brandId }: SeriesListProps) {
  const t = useTranslations("Admin")
  const { toast } = useToast()
  const { data: session } = useSession()
  const [series, setSeries] = useState<Series[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [newSeries, setNewSeries] = useState({ name: "", brand_id: brandId || "" })
  const [editSeries, setEditSeries] = useState<Series | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [seriesToDelete, setSeriesToDelete] = useState<Series | null>(null)
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>(brandId || "")
  const [error, setError] = useState<string | null>(null)
  const [isAddSeriesSubmitting, setIsAddSeriesSubmitting] = useState(false)
  const [isEditSeriesSubmitting, setIsEditSeriesSubmitting] = useState(false)
  const [isDeleteSeriesSubmitting, setIsDeleteSeriesSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([fetchSeries(), fetchBrands()])
      .then(() => setLoading(false))
      .catch(() => setLoading(false))
  }, [selectedBrandFilter])

  async function fetchSeries() {
    try {
      setLoading(true)
      setError(null)
      const url = selectedBrandFilter ? `/api/admin/series?brand_id=${selectedBrandFilter}` : "/api/admin/series"

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch series: ${response.status}`)
      }
      const data = await response.json()

      // Sort series by position
      const sortedSeries = [...data].sort((a, b) => {
        if (a.position !== null && a.position !== undefined && b.position !== null && b.position !== undefined) {
          return a.position - b.position
        }
        if (a.position !== null && a.position !== undefined) return -1
        if (b.position !== null && b.position !== undefined) return 1
        return a.name.localeCompare(b.name)
      })

      setSeries(sortedSeries)
    } catch (error) {
      console.error("Error fetching series:", error)
      setError("Failed to load series. Please try again later.")
      toast({
        title: t("error"),
        description: t("seriesFetchError") || "Failed to fetch series",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchBrands() {
    try {
      const response = await fetch("/api/admin/brands")
      const data = await response.json()
      setBrands(data)
    } catch (error) {
      console.error("Error fetching brands:", error)
      toast({
        title: t("error"),
        description: t("brandFetchError") || "Failed to fetch brands",
        variant: "destructive",
      })
    }
  }

  async function handleAddSeries() {
    if (!newSeries.name || !newSeries.brand_id) {
      toast({
        title: t("validationError"),
        description: t("nameAndBrandRequired") || "Name and brand are required",
        variant: "destructive",
      })
      return
    }

    setIsAddSeriesSubmitting(true)

    try {
      const response = await fetch("/api/admin/series", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSeries.name,
          brand_id: newSeries.brand_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add series")
      }

      await fetchSeries()
      setNewSeries({ name: "", brand_id: selectedBrandFilter || "" })

      // Close the dialog first, then show toast
      setIsAddDialogOpen(false)

      // Small delay to ensure dialog is closed before showing toast
      setTimeout(() => {
        toast({
          title: t("success"),
          description: t("seriesAddedSuccess") || "Series added successfully",
        })
      }, 100)
    } catch (error) {
      console.error("Error adding series:", error)
      toast({
        title: t("error"),
        description: t("seriesAddedError") || "Failed to add series",
        variant: "destructive",
      })
    } finally {
      setIsAddSeriesSubmitting(false)
    }
  }

  async function handleEditSeries() {
    if (!editSeries || !editSeries.name || !editSeries.brand_id) {
      toast({
        title: t("validationError"),
        description: t("nameAndBrandRequired") || "Name and brand are required",
        variant: "destructive",
      })
      return
    }

    setIsEditSeriesSubmitting(true)

    try {
      const response = await fetch(`/api/admin/series/${editSeries.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editSeries.name,
          brand_id: editSeries.brand_id,
          position: editSeries.position,
          userId: session?.user?.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update series")
      }

      await fetchSeries()

      // Close the dialog first, then show toast
      setIsEditDialogOpen(false)
      setEditSeries(null)

      // Small delay to ensure dialog is closed before showing toast
      setTimeout(() => {
        toast({
          title: t("success"),
          description: t("seriesUpdatedSuccess") || "Series updated successfully",
        })
      }, 100)
    } catch (error) {
      console.error("Error updating series:", error)
      toast({
        title: t("error"),
        description: t("seriesUpdatedError") || "Failed to update series",
        variant: "destructive",
      })
    } finally {
      setIsEditSeriesSubmitting(false)
    }
  }

  async function handleDeleteSeries() {
    if (!seriesToDelete) return

    setIsDeleteSeriesSubmitting(true)

    try {
      const response = await fetch(`/api/admin/series/${seriesToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete series")
      }

      await fetchSeries()

      // Close the dialog first, then show toast
      setIsDeleteDialogOpen(false)
      setSeriesToDelete(null)

      // Small delay to ensure dialog is closed before showing toast
      setTimeout(() => {
        toast({
          title: t("success"),
          description: t("seriesDeletedSuccess") || "Series deleted successfully",
        })
      }, 100)
    } catch (error) {
      console.error("Error deleting series:", error)
      toast({
        title: t("error"),
        description: t("seriesDeletedError") || "Failed to delete series",
        variant: "destructive",
      })
    } finally {
      setIsDeleteSeriesSubmitting(false)
    }
  }

  async function handleReorderSeries(result: any) {
    if (!result.destination) return

    const items = Array.from(series)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index + 1,
    }))

    setSeries(updatedItems)

    try {
      const response = await fetch("/api/admin/series/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          series: updatedItems.map((item) => ({
            id: item.id,
            position: item.position,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reorder series")
      }

      toast({
        title: t("success"),
        description: t("seriesReorderedSuccess") || "Series reordered successfully",
      })
    } catch (error) {
      console.error("Error reordering series:", error)
      toast({
        title: t("error"),
        description: t("seriesReorderedError") || "Failed to reorder series",
        variant: "destructive",
      })
      // Revert to original order
      await fetchSeries()
    }
  }

  async function moveSeriesUp(index: number) {
    if (index <= 0 || reordering) return

    setReordering(true)
    try {
      // Create a copy of the series array
      const updatedSeries = [...series]

      // Swap the positions
      const temp = updatedSeries[index].position
      updatedSeries[index].position = updatedSeries[index - 1].position
      updatedSeries[index - 1].position = temp

      // Swap the elements in the array
      ;[updatedSeries[index], updatedSeries[index - 1]] = [updatedSeries[index - 1], updatedSeries[index]]

      // Update the UI immediately
      setSeries(updatedSeries)

      // Update the positions in the database
      await updateSeriesPositions(updatedSeries)

      toast({
        title: t("success"),
        description: t("seriesReorderedSuccess") || "Series reordered successfully",
      })
    } catch (error) {
      console.error("Error reordering series:", error)
      toast({
        title: t("error"),
        description: t("seriesReorderedError") || "Failed to reorder series",
        variant: "destructive",
      })
      // Revert to original order by refetching
      await fetchSeries()
    } finally {
      setReordering(false)
    }
  }

  async function moveSeriesDown(index: number) {
    if (index >= series.length - 1 || reordering) return

    setReordering(true)
    try {
      // Create a copy of the series array
      const updatedSeries = [...series]

      // Swap the positions
      const temp = updatedSeries[index].position
      updatedSeries[index].position = updatedSeries[index + 1].position
      updatedSeries[index + 1].position = temp

      // Swap the elements in the array
      ;[updatedSeries[index], updatedSeries[index + 1]] = [updatedSeries[index + 1], updatedSeries[index]]

      // Update the UI immediately
      setSeries(updatedSeries)

      // Update the positions in the database
      await updateSeriesPositions(updatedSeries)

      toast({
        title: t("success"),
        description: t("seriesReorderedSuccess") || "Series reordered successfully",
      })
    } catch (error) {
      console.error("Error reordering series:", error)
      toast({
        title: t("error"),
        description: t("seriesReorderedError") || "Failed to reorder series",
        variant: "destructive",
      })
      // Revert to original order by refetching
      await fetchSeries()
    } finally {
      setReordering(false)
    }
  }

  async function updateSeriesPositions(updatedSeries: Series[]) {
    try {
      const response = await fetch("/api/admin/series/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          series: updatedSeries.map((series, index) => ({
            id: series.id,
            position: index + 1, // Ensure positions are sequential
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update series positions")
      }
    } catch (error) {
      console.error("Error updating series positions:", error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("series") || "Series"}</h2>
          <p className="text-muted-foreground">{t("manageSeries") || "Manage product series"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant={isReorderMode ? "default" : "outline"} onClick={() => setIsReorderMode(!isReorderMode)}>
            <MoveVertical className="mr-2 h-4 w-4" />
            {isReorderMode ? t("doneReordering") || "Done" : t("reorderSeries") || "Reorder"}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} disabled={isAddSeriesSubmitting}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addSeries") || "Add Series"}
          </Button>
        </div>
      </div>

      {!brandId && (
        <div className="mb-4">
          <Label htmlFor="brand-filter">{t("filterByBrand") || "Filter by Brand"}</Label>
          <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
            <SelectTrigger id="brand-filter" className="mt-1">
              <SelectValue placeholder={t("allBrands") || "All Brands"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allBrands") || "All Brands"}</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id || "default-brand-id"}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("seriesTitle") || "Product Series"}</CardTitle>
          <CardDescription>{t("seriesDescription") || "Manage product series for each brand"}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p>{t("loading") || "Loading..."}</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40 text-destructive">
              <p>{error}</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleReorderSeries}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {isReorderMode && <TableHead className="w-[50px]"></TableHead>}
                    <TableHead>{t("name") || "Name"}</TableHead>
                    {!brandId && <TableHead>{t("brand") || "Brand"}</TableHead>}
                    <TableHead>{t("createdAt") || "Created At"}</TableHead>
                    <TableHead className="text-right">{t("actions") || "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <Droppable droppableId="series" isDropDisabled={!isReorderMode}>
                  {(provided) => (
                    <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                      {series.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={isReorderMode ? (brandId ? 4 : 5) : brandId ? 3 : 4}
                            className="text-center"
                          >
                            {t("noSeries") || "No series found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        series.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!isReorderMode}>
                            {(provided) => (
                              <TableRow ref={provided.innerRef} {...provided.draggableProps}>
                                {isReorderMode && (
                                  <TableCell {...provided.dragHandleProps}>
                                    <MoveVertical className="h-5 w-5 text-muted-foreground" />
                                  </TableCell>
                                )}
                                <TableCell className="font-medium">{item.name}</TableCell>
                                {!brandId && <TableCell>{item.brands?.name}</TableCell>}
                                <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                  {!isReorderMode ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">{t("openMenu") || "Open Menu"}</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>{t("actions") || "Actions"}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setEditSeries(item)
                                            setIsEditDialogOpen(true)
                                          }}
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />
                                          {t("edit") || "Edit"}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => {
                                            setSeriesToDelete(item)
                                            setIsDeleteDialogOpen(true)
                                          }}
                                        >
                                          <Trash className="mr-2 h-4 w-4" />
                                          {t("delete") || "Delete"}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : (
                                    <div className="flex justify-end space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveSeriesUp(index)}
                                        disabled={index === 0 || reordering}
                                      >
                                        <ArrowUp className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveSeriesDown(index)}
                                        disabled={index === series.length - 1 || reordering}
                                      >
                                        <ArrowDown className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </TableBody>
                  )}
                </Droppable>
              </Table>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Add Series Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addNewSeries") || "Add New Series"}</DialogTitle>
            <DialogDescription>
              {t("addNewSeriesDescription") || "Add a new product series to a brand"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="series-name">{t("seriesName") || "Series Name"}</Label>
              <Input
                id="series-name"
                value={newSeries.name}
                onChange={(e) => setNewSeries({ ...newSeries, name: e.target.value })}
                placeholder={t("seriesNamePlaceholder") || "Enter series name"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand">{t("brand") || "Brand"}</Label>
              <Select
                value={newSeries.brand_id}
                onValueChange={(value) => setNewSeries({ ...newSeries, brand_id: value })}
                disabled={!!brandId}
              >
                <SelectTrigger id="brand">
                  <SelectValue placeholder={t("selectBrand") || "Select Brand"} />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id || "default-brand-id"}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isAddSeriesSubmitting}>
              {t("cancel") || "Cancel"}
            </Button>
            <Button onClick={handleAddSeries} disabled={isAddSeriesSubmitting}>
              {t("add") || "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Series Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editSeries") || "Edit Series"}</DialogTitle>
            <DialogDescription>{t("editSeriesDescription") || "Edit product series details"}</DialogDescription>
          </DialogHeader>
          {editSeries && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t("seriesName") || "Series Name"}</Label>
                <Input
                  id="edit-name"
                  value={editSeries.name}
                  onChange={(e) => setEditSeries({ ...editSeries, name: e.target.value })}
                  placeholder={t("seriesNamePlaceholder") || "Enter series name"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-brand">{t("brand") || "Brand"}</Label>
                <Select
                  value={editSeries.brand_id}
                  onValueChange={(value) => setEditSeries({ ...editSeries, brand_id: value })}
                  disabled={!!brandId}
                >
                  <SelectTrigger id="edit-brand">
                    <SelectValue placeholder={t("selectBrand") || "Select Brand"} />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id || "default-brand-id"}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isEditSeriesSubmitting}>
              {t("cancel") || "Cancel"}
            </Button>
            <Button onClick={handleEditSeries} disabled={isEditSeriesSubmitting}>
              {t("save") || "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Series Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteSeries") || "Delete Series"}</DialogTitle>
            <DialogDescription>
              {t("deleteSeriesDescription") || "Are you sure you want to delete this series?"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              {t("deleteSeriesConfirmation", { series: seriesToDelete?.name }) ||
                `Are you sure you want to delete "${seriesToDelete?.name}"? This action cannot be undone.`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleteSeriesSubmitting}>
              {t("cancel") || "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleDeleteSeries} disabled={isDeleteSeriesSubmitting}>
              {t("confirmDelete") || "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
