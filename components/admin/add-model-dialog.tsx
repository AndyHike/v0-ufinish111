"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import { useAsyncAction } from "@/hooks/use-async-action"
import { ImageUpload } from "./image-upload"

type Brand = {
  id: string
  name: string
}

type Series = {
  id: string
  name: string
  brand_id: string
}

interface AddModelDialogProps {
  isOpen: boolean
  onClose: () => void
  onModelAdded: () => void
}

export function AddModelDialog({ isOpen, onClose, onModelAdded }: AddModelDialogProps) {
  const t = useTranslations("Admin")
  const { toast } = useToast()
  const { data: session } = useSession()
  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [newModel, setNewModel] = useState({ name: "", brandId: "", seriesId: "", imageUrl: "" })
  const dialogRef = useRef<HTMLDivElement>(null)

  const { execute, isLoading } = useAsyncAction({
    successMessage: t("modelAddedSuccess"),
    errorMessage: t("modelAddedError"),
    onSuccess: () => {
      setNewModel({ name: "", brandId: "", seriesId: "", imageUrl: "" })
      onModelAdded()
      onClose()
    },
  })

  useEffect(() => {
    if (isOpen) {
      fetchBrands()
    }
  }, [isOpen])

  useEffect(() => {
    if (newModel.brandId) {
      fetchSeries(newModel.brandId)
    } else {
      setSeries([])
    }
  }, [newModel.brandId])

  async function fetchBrands() {
    try {
      const response = await fetch("/api/admin/brands")
      const data = await response.json()
      setBrands(data)
    } catch (error) {
      console.error("Error fetching brands:", error)
      toast({
        title: t("error"),
        description: t("errorFetchingBrands"),
        variant: "destructive",
      })
    }
  }

  async function fetchSeries(brandId: string) {
    try {
      const response = await fetch(`/api/admin/series?brand_id=${brandId}`)
      const data = await response.json()
      setSeries(data)
      console.log("Fetched series for brand", brandId, ":", data)
    } catch (error) {
      console.error("Error fetching series:", error)
      toast({
        title: t("error"),
        description: t("errorFetchingSeries") || "Failed to fetch series",
        variant: "destructive",
      })
    }
  }

  async function handleAddModel() {
    if (!newModel.name || !newModel.brandId) {
      toast({
        title: t("validationError"),
        description: t("nameAndBrandRequired"),
        variant: "destructive",
      })
      return
    }

    await execute(async () => {
      const response = await fetch("/api/admin/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newModel,
          userId: session?.user?.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add model")
      }

      return response.json()
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && onClose()}>
      <DialogContent
        className="sm:max-w-[425px]"
        ref={dialogRef}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("addNewModel")}</DialogTitle>
          <DialogDescription>{t("addNewModelDescription")}</DialogDescription>
          <button
            onClick={() => !isLoading && onClose()}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="model-name">{t("modelName")}</Label>
            <Input
              id="model-name"
              value={newModel.name}
              onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
              placeholder={t("modelNamePlaceholder")}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="brand">{t("brand")}</Label>
            <Select
              value={newModel.brandId}
              onValueChange={(value) => setNewModel({ ...newModel, brandId: value, seriesId: "" })}
              disabled={isLoading}
            >
              <SelectTrigger id="brand">
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
            <Label htmlFor="series">{t("series") || "Series"}</Label>
            <Select
              value={newModel.seriesId}
              onValueChange={(value) => setNewModel({ ...newModel, seriesId: value })}
              disabled={isLoading || !newModel.brandId}
            >
              <SelectTrigger id="series">
                <SelectValue placeholder={t("selectSeries") || "Select Series"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{t("noSeries") || "No Series"}</SelectItem>
                {series.length > 0 ? (
                  series.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))
                ) : newModel.brandId ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">{t("noSeriesForBrand")}</div>
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">{t("selectBrandFirst")}</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{t("modelImage")}</Label>
            <ImageUpload
              onImageUploaded={(url) => setNewModel({ ...newModel, imageUrl: url })}
              currentImageUrl={newModel.imageUrl}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button onClick={handleAddModel} disabled={isLoading}>
            {isLoading ? t("processing") : t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
