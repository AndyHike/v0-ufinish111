"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
// Додамо імпорт для Layers іконки
import { Plus, Pencil, Trash, Upload, X, ArrowUp, ArrowDown, Layers } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import Link from "next/link"

type Brand = {
  id: string
  name: string
  logo_url: string | null
  created_at: string
  position?: number | null
}

export default function BrandsPage() {
  const t = useTranslations("Admin")
  const { toast } = useToast()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [newBrand, setNewBrand] = useState({ name: "", logo_url: "" })
  const [editBrand, setEditBrand] = useState<Brand | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleteImageDialogOpen, setIsDeleteImageDialogOpen] = useState(false)
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [reordering, setReordering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBrands()
  }, [])

  async function fetchBrands() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/admin/brands")
      if (!response.ok) {
        throw new Error(`Failed to fetch brands: ${response.status}`)
      }
      const data = await response.json()

      // Check if any brands don't have a position and assign positions if needed
      const needsPositionUpdate = data.some((brand) => brand.position === null || brand.position === undefined)

      if (needsPositionUpdate) {
        await assignPositionsToAllBrands(data)
        // Refetch brands after assigning positions
        const updatedResponse = await fetch("/api/admin/brands")
        if (!updatedResponse.ok) {
          throw new Error(`Failed to fetch updated brands: ${updatedResponse.status}`)
        }
        const updatedData = await updatedResponse.json()
        setBrands(updatedData)
      } else {
        // Sort brands by position
        const sortedBrands = [...data].sort((a, b) => {
          if (a.position !== null && a.position !== undefined && b.position !== null && b.position !== undefined) {
            return a.position - b.position
          }
          if (a.position !== null && a.position !== undefined) return -1
          if (b.position !== null && b.position !== undefined) return 1
          return a.name.localeCompare(b.name)
        })
        setBrands(sortedBrands)
      }
    } catch (error) {
      console.error("Error fetching brands:", error)
      setError("Failed to load brands. Please try again later.")
      toast({
        title: t("error"),
        description: t("brandFetchError") || "Failed to fetch brands",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function assignPositionsToAllBrands(brands: Brand[]) {
    try {
      // Sort brands by name for initial positioning
      const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name))

      // Assign positions
      const brandsWithPositions = sortedBrands.map((brand, index) => ({
        id: brand.id,
        position: index + 1,
      }))

      // Update all brand positions
      const response = await fetch("/api/admin/brands/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brands: brandsWithPositions,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign positions to brands")
      }

      return true
    } catch (error) {
      console.error("Error assigning positions to brands:", error)
      throw error
    }
  }

  async function handleAddBrand() {
    try {
      setIsSubmitting(true)

      let logoUrl = newBrand.logo_url

      // If there's a file selected, upload it first
      if (selectedFile) {
        logoUrl = await uploadBrandLogo(selectedFile)
      }

      // Get the highest position value
      const maxPosition = brands.length > 0 ? Math.max(...brands.map((brand) => brand.position || 0)) : 0

      const response = await fetch("/api/admin/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newBrand.name,
          logo_url: logoUrl,
          position: maxPosition + 1, // Add to the end of the list
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add brand")
      }

      await fetchBrands() // Refresh the brands list
      setNewBrand({ name: "", logo_url: "" })
      setSelectedFile(null)
      setImagePreview(null)
      setIsAddDialogOpen(false)

      toast({
        title: t("success"),
        description: t("brandAddedSuccess"),
      })
    } catch (error) {
      console.error("Error adding brand:", error)
      toast({
        title: t("error"),
        description: t("brandAddedError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEditBrand() {
    if (!editBrand) return

    try {
      setIsSubmitting(true)

      let logoUrl = editBrand.logo_url

      // If there's a file selected, upload it first
      if (selectedFile) {
        logoUrl = await uploadBrandLogo(selectedFile)
      }

      const response = await fetch(`/api/admin/brands/${editBrand.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editBrand.name,
          logo_url: logoUrl,
          position: editBrand.position || 999, // Fallback position if none exists
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update brand")
      }

      await fetchBrands() // Refresh the brands list
      setIsEditDialogOpen(false)
      setSelectedFile(null)
      setImagePreview(null)
      setEditBrand(null)

      toast({
        title: t("success"),
        description: t("brandUpdatedSuccess"),
      })
    } catch (error) {
      console.error("Error updating brand:", error)
      toast({
        title: t("error"),
        description: t("brandUpdatedError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteBrand() {
    if (!brandToDelete) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/brands/${brandToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete brand")
      }

      // After deleting, we need to reorder the remaining brands
      const remainingBrands = brands.filter((brand) => brand.id !== brandToDelete.id)
      await updateBrandPositions(remainingBrands)

      await fetchBrands() // Refresh the brands list
      setIsDeleteDialogOpen(false)
      setBrandToDelete(null)

      toast({
        title: t("success"),
        description: t("brandDeletedSuccess"),
      })
    } catch (error) {
      console.error("Error deleting brand:", error)
      toast({
        title: t("error"),
        description: t("brandDeletedError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteBrandImage() {
    if (!editBrand) return

    try {
      setIsSubmitting(true)

      // If the logo URL contains a storage path, delete the file from storage
      if (editBrand.logo_url && editBrand.logo_url.includes("storage/")) {
        const supabase = createClient()
        const path = editBrand.logo_url.split("/").slice(-2).join("/")
        await supabase.storage.from("brand-logos").remove([path])
      }

      const response = await fetch(`/api/admin/brands/${editBrand.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editBrand.name,
          logo_url: null,
          position: editBrand.position,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update brand")
      }

      await fetchBrands() // Refresh the brands list
      setEditBrand({ ...editBrand, logo_url: null })
      setIsDeleteImageDialogOpen(false)
      setImagePreview(null)

      toast({
        title: t("success"),
        description: t("imageDeletedSuccess"),
      })
    } catch (error) {
      console.error("Error deleting image:", error)
      toast({
        title: t("error"),
        description: t("imageDeletedError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function uploadBrandLogo(file: File): Promise<string> {
    try {
      setUploadingImage(true)

      // Create a form data object
      const formData = new FormData()
      formData.append("file", file)

      // Upload the file
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: t("error"),
        description: t("imageUploadError"),
        variant: "destructive",
      })
      throw error
    } finally {
      setUploadingImage(false)
    }
  }

  async function moveBrandUp(index: number) {
    if (index <= 0 || reordering) return

    setReordering(true)
    try {
      // Create a copy of the brands array
      const updatedBrands = [...brands]

      // Swap the positions
      const temp = updatedBrands[index].position || 0
      updatedBrands[index].position = updatedBrands[index - 1].position || 0
      updatedBrands[index - 1].position = temp

      // Swap the elements in the array
      ;[updatedBrands[index], updatedBrands[index - 1]] = [updatedBrands[index - 1], updatedBrands[index]]

      // Update the UI immediately
      setBrands(updatedBrands)

      // Update the positions in the database
      await updateBrandPositions(updatedBrands)

      toast({
        title: t("success"),
        description: t("brandReorderedSuccess") || "Brand reordered successfully",
      })
    } catch (error) {
      console.error("Error reordering brands:", error)
      toast({
        title: t("error"),
        description: t("brandReorderedError") || "Failed to reorder brand",
        variant: "destructive",
      })
      // Revert to original order by refetching
      await fetchBrands()
    } finally {
      setReordering(false)
    }
  }

  async function moveBrandDown(index: number) {
    if (index >= brands.length - 1 || reordering) return

    setReordering(true)
    try {
      // Create a copy of the brands array
      const updatedBrands = [...brands]

      // Swap the positions
      const temp = updatedBrands[index].position || 0
      updatedBrands[index].position = updatedBrands[index + 1].position || 0
      updatedBrands[index + 1].position = temp

      // Swap the elements in the array
      ;[updatedBrands[index], updatedBrands[index + 1]] = [updatedBrands[index + 1], updatedBrands[index]]

      // Update the UI immediately
      setBrands(updatedBrands)

      // Update the positions in the database
      await updateBrandPositions(updatedBrands)

      toast({
        title: t("success"),
        description: t("brandReorderedSuccess") || "Brand reordered successfully",
      })
    } catch (error) {
      console.error("Error reordering brands:", error)
      toast({
        title: t("error"),
        description: t("brandReorderedError") || "Failed to reorder brand",
        variant: "destructive",
      })
      // Revert to original order by refetching
      await fetchBrands()
    } finally {
      setReordering(false)
    }
  }

  async function updateBrandPositions(updatedBrands: Brand[]) {
    try {
      const response = await fetch("/api/admin/brands/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brands: updatedBrands.map((brand, index) => ({
            id: brand.id,
            position: index + 1, // Ensure positions are sequential
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update brand positions")
      }
    } catch (error) {
      console.error("Error updating brand positions:", error)
      throw error
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: t("error"),
          description: t("invalidFileType"),
          variant: "destructive",
        })
        return
      }

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t("error"),
          description: t("fileTooLarge"),
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)

      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function openEditDialog(brand: Brand) {
    setEditBrand(brand)
    setImagePreview(brand.logo_url)
    setIsEditDialogOpen(true)
  }

  function openDeleteDialog(brand: Brand) {
    setBrandToDelete(brand)
    setIsDeleteDialogOpen(true)
  }

  function openDeleteImageDialog() {
    setIsDeleteImageDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("brands")}</h1>
          <p className="text-muted-foreground">{t("manageBrands")}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("addBrand")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addNewBrand")}</DialogTitle>
              <DialogDescription>{t("addNewBrandDescription")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {t("brandName")}
                </label>
                <Input
                  id="name"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                  placeholder={t("brandNamePlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="logo" className="text-sm font-medium">
                  {t("logoUrl")}
                </label>
                <Input
                  id="logo"
                  value={newBrand.logo_url}
                  onChange={(e) => setNewBrand({ ...newBrand, logo_url: e.target.value })}
                  placeholder={t("logoUrlPlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("uploadLogo")}</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t("selectFile")}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setImagePreview(null)
                        setSelectedFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-2 relative w-20 h-20 border rounded overflow-hidden">
                    <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setImagePreview(null)
                  setSelectedFile(null)
                }}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleAddBrand} disabled={!newBrand.name || isSubmitting || uploadingImage}>
                {isSubmitting ? "..." : t("add")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("brandsTitle")}</CardTitle>
          <CardDescription>{t("brandsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p>Loading brands...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40 text-destructive">
              <p>{error}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t("order") || "Order"}</TableHead>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("logo")}</TableHead>
                  <TableHead>{t("createdAt")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {t("noBrands")}
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((brand, index) => (
                    <TableRow key={brand.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveBrandUp(index)}
                            disabled={index === 0 || reordering}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveBrandDown(index)}
                            disabled={index === brands.length - 1 || reordering}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell>
                        {brand.logo_url ? (
                          <div className="h-10 w-10 overflow-hidden rounded-md border bg-white">
                            <Image
                              src={brand.logo_url || "/placeholder.svg"}
                              alt={brand.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : (
                          t("noLogo")
                        )}
                      </TableCell>
                      <TableCell>{new Date(brand.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {/* Додамо кнопку для управління серіями в DropdownMenu для кожного бренду */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(brand)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/brands/${brand.id}/series`}>
                                <Layers className="mr-2 h-4 w-4" />
                                {t("manageSeries") || "Manage Series"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(brand)}>
                              <Trash className="mr-2 h-4 w-4" />
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
          )}
        </CardContent>
      </Card>

      {/* Edit Brand Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editBrand")}</DialogTitle>
            <DialogDescription>{t("editBrandDescription")}</DialogDescription>
          </DialogHeader>
          {editBrand && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-name" className="text-sm font-medium">
                  {t("brandName")}
                </label>
                <Input
                  id="edit-name"
                  value={editBrand.name}
                  onChange={(e) => setEditBrand({ ...editBrand, name: e.target.value })}
                  placeholder={t("brandNamePlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="edit-logo" className="text-sm font-medium">
                  {t("logoUrl")}
                </label>
                <Input
                  id="edit-logo"
                  value={editBrand.logo_url || ""}
                  onChange={(e) => setEditBrand({ ...editBrand, logo_url: e.target.value })}
                  placeholder={t("logoUrlPlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">{t("uploadLogo")}</label>
                  {editBrand.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={openDeleteImageDialog}
                    >
                      <Trash className="mr-1 h-3 w-3" />
                      {t("deleteLogo")}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t("selectFile")}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setImagePreview(editBrand.logo_url)
                        setSelectedFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-2 relative w-20 h-20 border rounded overflow-hidden">
                    <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedFile(null)
              }}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleEditBrand} disabled={!editBrand?.name || isSubmitting || uploadingImage}>
              {isSubmitting ? "..." : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Brand Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteBrand")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteBrandDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBrand} disabled={isSubmitting}>
              {isSubmitting ? "..." : t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Image Dialog */}
      <AlertDialog open={isDeleteImageDialogOpen} onOpenChange={setIsDeleteImageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteImage")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteImageDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBrandImage} disabled={isSubmitting}>
              {isSubmitting ? "..." : t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
