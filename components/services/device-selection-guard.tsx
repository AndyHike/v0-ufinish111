"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Search, Smartphone } from "lucide-react"
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
  const brandsT = useTranslations("Brands")
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
    let isMounted = true

    const loadBrands = async () => {
      try {
        if (!isMounted) return

        setIsLoading(true)
        setError(null)

        const { data, error: dbError } = await supabase
          .from("brands")
          .select("id, name, slug, logo_url")
          .order("position")
          .order("name")

        if (!isMounted) return

        if (dbError) throw dbError
        setBrands(data || [])
      } catch (err) {
        if (!isMounted) return
        console.error("[v0] Error loading brands:", err)
        setError(t("loadingError"))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadBrands()

    return () => {
      isMounted = false
    }
  }, [])

  // Load series when brand is selected
  useEffect(() => {
    if (!selectedBrandId) {
      setSeries([])
      setModels([])
      return
    }

    let isMounted = true

    const loadSeries = async () => {
      try {
        if (!isMounted) return

        setIsLoading(true)
        setError(null)

        const { data, error: dbError } = await supabase
          .from("series")
          .select("id, name, slug, brand_id")
          .eq("brand_id", selectedBrandId)
          .order("position")
          .order("name")

        if (!isMounted) return

        if (dbError) throw dbError
        setSeries(data || [])
        setModels([])
        setSelectedSeriesId(null)
      } catch (err) {
        if (!isMounted) return
        console.error("[v0] Error loading series:", err)
        setError(t("loadingError"))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSeries()

    return () => {
      isMounted = false
    }
  }, [selectedBrandId])

  // Load models when series is selected
  useEffect(() => {
    if (!selectedSeriesId) {
      setModels([])
      return
    }

    let isMounted = true

    const loadModels = async () => {
      try {
        if (!isMounted) return

        setIsLoading(true)
        setError(null)

        const { data, error: dbError } = await supabase
          .from("models")
          .select("id, name, slug, image_url, series_id")
          .eq("series_id", selectedSeriesId)
          .order("position")
          .order("name")

        if (!isMounted) return

        if (dbError) throw dbError
        setModels(data || [])
      } catch (err) {
        if (!isMounted) return
        console.error("[v0] Error loading models:", err)
        setError(t("loadingError"))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadModels()

    return () => {
      isMounted = false
    }
  }, [selectedSeriesId])

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
    // Smooth scroll to selection title if it's too far
    window.scrollTo({ top: 300, behavior: 'smooth' });
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

      // Redirect to service page with model as URL segment
      router.push(`/${locale}/services/${serviceSlug}/${modelSlug}`)
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

  return (
    <div className="w-full">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="gap-2 rounded-xl border-gray-200 hover:bg-white hover:text-blue-600 transition-all font-medium"
            >
              <ChevronLeft className="h-4 w-4" />
              {brandsT("back") || "Back"}
            </Button>
          )}
          <div className="flex items-center gap-2 overflow-hidden">
            <span className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></span>
            <span className={`h-1 w-8 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></span>
            <span className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></span>
            <span className={`h-1 w-8 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></span>
            <span className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></span>
          </div>
        </div>

        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          {step === 1 && <span className="text-blue-600">{t("selectBrand") || "1. Select Brand"}</span>}
          {step === 2 && (
            <>
              <span className="text-gray-400">{selectedBrand?.name}</span>
              <span className="text-gray-300">/</span>
              <span className="text-blue-600">{t("selectSeries") || "2. Select Series"}</span>
            </>
          )}
          {step === 3 && (
            <>
              <span className="text-gray-400">{selectedBrand?.name}</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-400">{selectedSeries?.name}</span>
              <span className="text-gray-300">/</span>
              <span className="text-blue-600">{t("selectDevice") || "3. Select Device"}</span>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
          {error}
        </div>
      )}

      {/* Main Selection Area */}
      <div className="min-h-[400px]">
        {/* Search Bar */}
        <div className="mb-8 relative max-w-md mx-auto sm:mx-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder={
              step === 1 ? (t("searchBrand") || "Search brand...") :
                step === 2 ? (t("searchSeries") || "Search series...") :
                  (t("searchDevice") || "Search model...")
            }
            value={step === 1 ? brandsSearch : step === 2 ? seriesSearch : modelsSearch}
            onChange={(e) => step === 1 ? setBrandsSearch(e.target.value) : step === 2 ? setSeriesSearch(e.target.value) : setModelsSearch(e.target.value)}
            className="pl-12 h-14 bg-white border-gray-100 rounded-2xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg transition-all"
            disabled={isLoading || isSubmitting}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="font-medium">{t("loading") || "Loading..."}</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* Step 1: Brand Grid */}
            {step === 1 && (
              filteredBrands.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  {t("noBrands") || "No brands found"}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {filteredBrands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleSelectBrand(brand.id)}
                      className="group flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-200"
                    >
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-xl bg-gray-50 p-3 group-hover:bg-blue-50 transition-colors">
                        {brand.logo_url ? (
                          <img
                            src={formatImageUrl(brand.logo_url)}
                            alt={brand.name}
                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <Smartphone className="w-8 h-8 text-gray-300" />
                        )}
                      </div>
                      <h3 className="text-center text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">{brand.name}</h3>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* Step 2: Series Selection */}
            {step === 2 && (
              filteredSeries.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  {t("noSeries") || "No series found for this brand"}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSeries.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSeries(s.id)}
                      className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-8 bg-blue-100 group-hover:bg-blue-600 rounded-full transition-colors"></div>
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{s.name}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-all transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              )
            )}

            {/* Step 3: Model Grid */}
            {step === 3 && (
              filteredModels.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  {t("noDevices") || "No devices found for this series"}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {filteredModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSelectModel(model.slug!)}
                      disabled={isSubmitting}
                      className="group flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-xl bg-gray-50 p-3 group-hover:bg-blue-50 transition-colors">
                        {model.image_url ? (
                          <img
                            src={formatImageUrl(model.image_url)}
                            alt={model.name}
                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <Smartphone className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                      <h3 className="text-center text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">{model.name}</h3>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
