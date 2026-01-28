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
import { Plus, Pencil, Trash, MoveVertical, MoreHorizontal, DollarSign } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { AddModelDialog } from "@/components/admin/add-model-dialog"
import { useAsyncAction } from "@/hooks/use-async-action"
import { ImageUpload } from "@/components/admin/image-upload"

type Brand = {
  id: string
  name: string
}

type Series = {
  id: string
  name: string
  brand_id: string
}

type Model = {
  id: string
  name: string
  brand_id: string
  series_id: string | null
  image_url: string | null
  created_at: string
  position: number
  brands: {
    name: string
  }
  series: {
    name: string
  } | null
}

export default function ModelsPage() {
  const t = useTranslations("Admin")
  const { toast } = useToast()
  const { data: session } = useSession()
  const [models, setModels] = useState<Model[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [editModel, setEditModel] = useState<Model | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null)
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("")
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>("")
  const [editModelSeries, setEditModelSeries] = useState<Series[]>([])

  const { execute: executeEditModel, isLoading: isEditLoading } = useAsyncAction({
    successMessage: t("modelUpdatedSuccess"),
    errorMessage: t("modelUpdatedError"),
    onSuccess: () => {
      setIsEditDialogOpen(false)
      setEditModel(null)
    },
  })

  const { execute: executeDeleteModel, isLoading: isDeleteLoading } = useAsyncAction({
    successMessage: t("modelDeletedSuccess"),
    errorMessage: t("modelDeletedError"),
    onSuccess: () => {
      setIsDeleteDialogOpen(false)
      setModelToDelete(null)
    },
  })

  const { execute: executeReorderModels, isLoading: isReorderLoading } = useAsyncAction({
    successMessage: t("modelReorderedSuccess"),
    errorMessage: t("modelReorderedError"),
  })

  useEffect(() => {
    Promise.all([fetchModels(), fetchBrands()])
      .then(() => setLoading(false))
      .catch(() => setLoading(false))
  }, [selectedBrandFilter, selectedSeriesFilter])

  useEffect(() => {
    if (selectedBrandFilter) {
      fetchSeries(selectedBrandFilter)
    } else {
      setSeries([])
      setSelectedSeriesFilter("")
    }
  }, [selectedBrandFilter])

  // When edit model is set, fetch its series
  useEffect(() => {
    if (editModel && editModel.brand_id) {
      fetchSeriesForEdit(editModel.brand_id)
    }
  }, [editModel])

  async function fetchModels() {
    try {
      let url = "/api/admin/models"
      const params = new URLSearchParams()

      if (selectedBrandFilter) {
        params.append("brand_id", selectedBrandFilter)
      }

      if (selectedSeriesFilter && selectedSeriesFilter !== "all") {
        params.append("series_id", selectedSeriesFilter)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      const data = await response.json()
      setModels(data)
    } catch (error) {
      console.error("Error fetching models:", error)
      toast({
        title: "Error",
        description: "Failed to fetch models",
        variant: "destructive",
      })
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
        title: "Error",
        description: "Failed to fetch brands",
        variant: "destructive",
      })
    }
  }

  async function fetchSeries(brandId: string) {
    try {
      const response = await fetch(`/api/admin/series?brand_id=${brandId}`)
      const data = await response.json()
      setSeries(data)
    } catch (error) {
      console.error("Error fetching series:", error)
      toast({
        title: "Error",
        description: "Failed to fetch series",
        variant: "destructive",
      })
    }
  }

  async function fetchSeriesForEdit(brandId: string) {
    try {
      const response = await fetch(`/api/admin/series?brand_id=${brandId}`)
      const data = await response.json()
      setEditModelSeries(data)
      console.log("Fetched series for edit:", data)
    } catch (error) {
      console.error("Error fetching series for edit:", error)
      toast({
        title: "Error",
        description: "Failed to fetch series",
        variant: "destructive",
      })
    }
  }

  async function handleEditModel() {
    if (!editModel) return

    await executeEditModel(async () => {
      // If position changed, reorder the items
      let updatedModels = models
      if (editModel.position && editModel.position !== models.find((m) => m.id === editModel.id)?.position) {
        const currentIndex = models.findIndex((m) => m.id === editModel.id)
        const newIndex = editModel.position - 1

        if (currentIndex !== -1 && newIndex !== -1 && newIndex !== currentIndex) {
          updatedModels = [...models]
          const [item] = updatedModels.splice(currentIndex, 1)
          updatedModels.splice(newIndex, 0, item)

          // Update all positions
          updatedModels = updatedModels.map((m, idx) => ({
            ...m,
            position: idx + 1,
          }))
        }
      }

      const response = await fetch(`/api/admin/models/${editModel.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editModel.name,
          brandId: editModel.brand_id,
          seriesId: editModel.series_id,
          imageUrl: editModel.image_url,
          position: editModel.position || 1,
          userId: session?.user?.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update model")
      }

      // If position changed, update all affected models
      if (editModel.position && editModel.position !== models.find((m) => m.id === editModel.id)?.position) {
        await updateModelPositions(updatedModels)
        setModels(updatedModels)
      } else {
        await fetchModels()
      }

      return response.json()
    })
  }

  async function updateModelPositions(updatedModels: Model[]) {
    try {
      const response = await fetch("/api/admin/models/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          models: updatedModels.map((model, index) => ({
            id: model.id,
            position: index + 1, // Ensure positions are sequential
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update model positions")
      }
    } catch (error) {
      console.error("Error updating model positions:", error)
      throw error
    }
  }

  async function handleDeleteModel() {
    if (!modelToDelete) return

    await executeDeleteModel(async () => {
      const response = await fetch(`/api/admin/models/${modelToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete model")
      }

      await fetchModels()
      return response.json()
    })
  }

  async function handleReorderModels(result: any) {
    if (!result.destination) return

    const items = Array.from(models)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }))

    setModels(updatedItems)

    await executeReorderModels(async () => {
      const response = await fetch("/api/admin/models/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          models: updatedItems.map((item) => ({
            id: item.id,
            position: item.position,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reorder models")
      }

      return response.json()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("models")}</h1>
          <p className="text-muted-foreground">{t("manageModels")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isReorderMode ? "default" : "outline"}
            onClick={() => setIsReorderMode(!isReorderMode)}
            disabled={isReorderLoading}
          >
            <MoveVertical className="mr-2 h-4 w-4" />
            {isReorderMode ? t("doneReordering") : t("reorderModels")}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addModel")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("models")}</CardTitle>
          <CardDescription>{t("modelsDescription")}</CardDescription>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="brand-filter">{t("filterByBrand")}</Label>
              <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
                <SelectTrigger id="brand-filter" className="mt-1">
                  <SelectValue placeholder={t("allBrands")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allBrands")}</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="series-filter">{t("filterBySeries")}</Label>
              <Select
                value={selectedSeriesFilter}
                onValueChange={setSelectedSeriesFilter}
                disabled={!selectedBrandFilter || series.length === 0}
              >
                <SelectTrigger id="series-filter" className="mt-1">
                  <SelectValue placeholder={t("allSeries")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allSeries")}</SelectItem>
                  {series.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p>{t("loading")}</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleReorderModels}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {isReorderMode && <TableHead className="w-[50px]"></TableHead>}
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("brand")}</TableHead>
                    <TableHead>{t("series")}</TableHead>
                    <TableHead>{t("image") || "Image"}</TableHead>
                    <TableHead>{t("createdAt")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <Droppable droppableId="models" isDropDisabled={!isReorderMode}>
                  {(provided) => (
                    <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                      {models.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isReorderMode ? 7 : 6} className="text-center">
                            {t("noModels")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        models.map((model, index) => (
                          <Draggable
                            key={model.id}
                            draggableId={model.id}
                            index={index}
                            isDragDisabled={!isReorderMode}
                          >
                            {(provided) => (
                              <TableRow ref={provided.innerRef} {...provided.draggableProps}>
                                {isReorderMode && (
                                  <TableCell {...provided.dragHandleProps}>
                                    <MoveVertical className="h-5 w-5 text-muted-foreground" />
                                  </TableCell>
                                )}
                                <TableCell className="font-medium">
                                  <Link href={`/admin/models/${model.id}/services`} className="hover:underline">
                                    {model.name}
                                  </Link>
                                </TableCell>
                                <TableCell>{model.brands?.name}</TableCell>
                                <TableCell>{model.series?.name || t("noSeries")}</TableCell>
                                <TableCell>
                                  {model.image_url ? (
                                    <div className="h-10 w-10 overflow-hidden rounded-md">
                                      <Image
                                        src={model.image_url || "/placeholder.svg"}
                                        alt={model.name}
                                        width={40}
                                        height={40}
                                        className="h-full w-full object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">{t("noImage") || "No image"}</span>
                                  )}
                                </TableCell>
                                <TableCell>{new Date(model.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
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
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setEditModel(model)
                                          setIsEditDialogOpen(true)
                                        }}
                                      >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        {t("edit")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <Link href={`/admin/models/${model.id}/services`}>
                                          <DollarSign className="mr-2 h-4 w-4" />
                                          {t("manageServices")}
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setModelToDelete(model)
                                          setIsDeleteDialogOpen(true)
                                        }}
                                      >
                                        <Trash className="mr-2 h-4 w-4" />
                                        {t("delete")}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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

      {/* Add Model Dialog */}
      <AddModelDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onModelAdded={fetchModels} />

      {/* Edit Model Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!isEditLoading) {
            setIsEditDialogOpen(open)
          }
        }}
      >
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t("editModel")}</DialogTitle>
            <DialogDescription>{t("editModelDescription")}</DialogDescription>
          </DialogHeader>
          {editModel && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t("modelName")}</Label>
                <Input
                  id="edit-name"
                  value={editModel.name}
                  onChange={(e) => setEditModel({ ...editModel, name: e.target.value })}
                  placeholder={t("modelNamePlaceholder")}
                  disabled={isEditLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-brand">{t("brand")}</Label>
                <Select
                  value={editModel.brand_id}
                  onValueChange={(value) => {
                    setEditModel({ ...editModel, brand_id: value, series_id: null })
                    fetchSeriesForEdit(value)
                  }}
                  disabled={isEditLoading}
                >
                  <SelectTrigger id="edit-brand">
                    <SelectValue placeholder={t("selectBrand")} />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-series">{t("series")}</Label>
                <Select
                  value={editModel.series_id || "_none"}
                  onValueChange={(value) => setEditModel({ ...editModel, series_id: value === "_none" ? null : value })}
                  disabled={isEditLoading}
                >
                  <SelectTrigger id="edit-series">
                    <SelectValue placeholder={t("selectSeries")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">{t("noSeries")}</SelectItem>
                    {editModelSeries.length > 0 ? (
                      editModelSeries.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">{t("noSeriesForBrand")}</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("modelImage")}</Label>
                <ImageUpload
                  onImageUploaded={(url) => setEditModel({ ...editModel, image_url: url })}
                  currentImageUrl={editModel.image_url}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-position">{t("position") || "Position"}</Label>
                <Input
                  id="edit-position"
                  type="number"
                  min="1"
                  max={models.length}
                  value={editModel.position || ""}
                  onChange={(e) => {
                    const newPosition = e.target.value ? parseInt(e.target.value, 10) : null
                    if (newPosition === null || (newPosition >= 1 && newPosition <= models.length)) {
                      setEditModel({ ...editModel, position: newPosition || 1 })
                    }
                  }}
                  placeholder={t("enterPosition") || "Enter position"}
                  disabled={isEditLoading}
                />
                <p className="text-xs text-muted-foreground">{t("positionInfo") || `1-${models.length}`}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isEditLoading}>
              {t("cancel")}
            </Button>
            <Button onClick={handleEditModel} disabled={isEditLoading}>
              {isEditLoading ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Model Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleteLoading) {
            setIsDeleteDialogOpen(open)
          }
        }}
      >
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t("deleteModel")}</DialogTitle>
            <DialogDescription>{t("deleteModelDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>{t("deleteModelConfirmation", { model: modelToDelete?.name })}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleteLoading}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteModel} disabled={isDeleteLoading}>
              {isDeleteLoading ? t("deleting") : t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
