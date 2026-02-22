"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/utils/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Search } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"

interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

interface Series {
  id: string
  name: string
  slug: string
  brand_id: string
}

interface Model {
  id: string
  name: string
  slug: string
  image_url: string | null
  series_id: string
}

interface DeviceSelectionGuardProps {
  serviceSlug: string
  locale: string
}

type SelectionStep = 1 | 2 | 3

export function DeviceSelectionGuard({ serviceSlug, locale }: DeviceSelectionGuardProps) {
  const t = useTranslations("Services")
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<SelectionStep>(1)
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [selectedModelSlug, setSelectedModelSlug] = useState<string | null>(null)

  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [models, setModels] = useState<Model[]>([])

  const [brandsSearch, setBrandsSearch] = useState("")
  const [seriesSearch, setSeriesSearch] = useState("")
  const [modelsSearch, setModelsSearch] = useState("")

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load brands on mount
  useEffect(() => {
    const loadBrands = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: dbError } = await supabase
          .from("brands")
          .select("id, name, slug, logo_url")
          .order("position")
          .order("name")

        if (dbError) throw dbError
        setBrands(data || [])
      } catch (err) {
        console.error("[v0] Error loading brands:", err)
        setError(t("loadingError"))
      } finally {
        setIsLoading(false)
      }
    }

    loadBrands()
  }, [supabase, t])

  // Load series when brand is selected
  useEffect(() => {
    if (!selectedBrandId) {
      setSeries([])
      setModels([])
      return
    }

    const loadSeries = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: dbError } = await supabase
          .from("series")
          .select("id, name, slug, brand_id")
          .eq("brand_id", selectedBrandId)
          .order("position")
          .order("name")

        if (dbError) throw dbError
        setSeries(data || [])
        setModels([])
        setSelectedSeriesId(null)
      } catch (err) {
        console.error("[v0] Error loading series:", err)
        setError(t("loadingError"))
      } finally {
        setIsLoading(false)
      }
    }

    loadSeries()
  }, [selectedBrandId, supabase, t])

  // Load models when series is selected
  useEffect(() => {
    if (!selectedSeriesId) {
      setModels([])
      return
    }

    const loadModels = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: dbError } = await supabase
          .from("models")
          .select("id, name, slug, image_url, series_id")
          .eq("series_id", selectedSeriesId)
          .order("position")
          .order("name")

        if (dbError) throw dbError
        setModels(data || [])
      } catch (err) {
        console.error("[v0] Error loading models:", err)
        setError(t("loadingError"))
      } finally {
        setIsLoading(false)
      }
    }

    loadModels()
  }, [selectedSeriesId, supabase, t])

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(brandsSearch.toLowerCase())
  )

  const filteredSeries = series.filter((s) =>
    s.name.toLowerCase().includes(seriesSearch.toLowerCase())
  )

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(modelsSearch.toLowerCase())
  )

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId)
    setStep(2)
    setBrandsSearch("")
  }

  const handleSelectSeries = (seriesId: string) => {
    setSelectedSeriesId(seriesId)
    setStep(3)
    setSeriesSearch("")
  }

  const handleSelectModel = async (modelSlug: string) => {
    setSelectedModelSlug(modelSlug)

    // Verify that the service exists for this model
    try {
      setIsSubmitting(true)
      setError(null)

      // Get model ID
      const { data: model, error: modelError } = await supabase
        .from("models")
        .select("id")
        .eq("slug", modelSlug)
        .single()

      if (modelError || !model) {
        setError(t("modelNotFound"))
        return
      }

      // Get service ID
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("id")
        .eq("slug", serviceSlug)
        .single()

      if (serviceError || !service) {
        setError(t("loadingError"))
        return
      }

      // Check if service exists for this model
      const { data: modelService, error: checkError } = await supabase
        .from("model_services")
        .select("id")
        .eq("model_id", model.id)
        .eq("service_id", service.id)
        .single()

      if (checkError || !modelService) {
        setError(t("serviceNotAvailable"))
        return
      }

      // Redirect to service page with model parameter
      router.push(`/${locale}/services/${serviceSlug}?model=${modelSlug}`)
    } catch (err) {
      console.error("[v0] Error verifying service:", err)
      setError(t("verificationError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (step === 1) return

    if (step === 2) {
      setSelectedBrandId(null)
      setSeries([])
      setStep(1)
      setSeriesSearch("")
    } else if (step === 3) {
      setSelectedSeriesId(null)
      setModels([])
      setStep(2)
      setModelsSearch("")
    }
  }

  const selectedBrand = brands.find((b) => b.id === selectedBrandId)
  const selectedSeries = series.find((s) => s.id === selectedSeriesId)

  const breadcrumb = [
    selectedBrand?.name,
    selectedSeries?.name,
  ].filter(Boolean).join(" > ")

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {step === 1 && t("selectBrand")}
              {step === 2 && t("selectSeries")}
              {step === 3 && t("selectDevice")}
            </DialogTitle>
            {step > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          {breadcrumb && (
            <p className="text-sm text-gray-600 mt-2">{breadcrumb}</p>
          )}
        </DialogHeader>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {/* Step 1: Brand Selection */}
          {step === 1 && (
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("searchBrand")}
                  value={brandsSearch}
                  onChange={(e) => setBrandsSearch(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-500">{t("loading")}</div>
              ) : filteredBrands.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{t("noBrands")}</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredBrands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleSelectBrand(brand.id)}
                      className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
                    >
                      {brand.logo_url && (
                        <img
                          src={formatImageUrl(brand.logo_url)}
                          alt={brand.name}
                          className="h-8 mb-2 object-contain"
                        />
                      )}
                      <p className="text-sm font-medium text-gray-900">{brand.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Series Selection */}
          {step === 2 && (
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("searchSeries")}
                  value={seriesSearch}
                  onChange={(e) => setSeriesSearch(e.target.value)}
                  className="pl-9"
                  disabled={isLoading}
                />
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-500">{t("loading")}</div>
              ) : filteredSeries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{t("noSeries")}</div>
              ) : (
                <div className="space-y-2">
                  {filteredSeries.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSeries(s.id)}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
                    >
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Model Selection */}
          {step === 3 && (
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("searchDevice")}
                  value={modelsSearch}
                  onChange={(e) => setModelsSearch(e.target.value)}
                  className="pl-9"
                  disabled={isLoading || isSubmitting}
                />
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-500">{t("loading")}</div>
              ) : filteredModels.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{t("noDevices")}</div>
              ) : (
                <div className="space-y-2">
                  {filteredModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSelectModel(model.slug!)}
                      disabled={isSubmitting}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                      {model.image_url && (
                        <img
                          src={formatImageUrl(model.image_url)}
                          alt={model.name}
                          className="h-12 w-12 object-contain flex-shrink-0"
                        />
                      )}
                      <p className="text-sm font-medium text-gray-900">{model.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
