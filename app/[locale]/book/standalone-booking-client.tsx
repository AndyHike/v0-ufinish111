"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import StepBrand from "./steps/step-brand"
import StepSeries from "./steps/step-series"
import StepModel from "./steps/step-model"
import StepService from "./steps/step-service"
import BookingConfirmation from "./booking-confirmation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, ChevronRight, Wrench, Smartphone } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface Brand {
  id: string
  name: string
  slug: string
}

interface Series {
  id: string
  name: string
  slug: string
}

interface Model {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

interface Service {
  id: string
  name: string
  slug: string
  price: number | null
  warranty_months?: number
  duration_hours?: number
  warranty_period?: string
}

interface StandaloneBookingClientProps {
  locale: string
}

export default function StandaloneBookingClient({ locale }: StandaloneBookingClientProps) {
  const t = useTranslations("StandaloneBooking")
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Визначаємо поточний крок на основі URL параметрів
  const brandSlug = searchParams.get("brand")
  const seriesSlug = searchParams.get("series")
  const modelSlug = searchParams.get("model")
  
  const getStep = () => {
    if (modelSlug) return 4
    if (seriesSlug) return 3
    if (brandSlug) return 2
    return 1
  }
  
  const step = getStep()
  
  const [loading, setLoading] = useState(false)
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Функція для оновлення URL
  const updateUrl = (params: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString())
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        current.delete(key)
      } else {
        current.set(key, value)
      }
    })
    
    router.push(`?${current.toString()}`)
  }

  // Завантаження брендів при першому візиті
  useEffect(() => {
    if (step === 1) {
      const fetchBrands = async () => {
        setLoading(true)
        setError(null)
        try {
          console.log("[v0] Fetching brands")
          const response = await fetch(`/api/admin/brands`)
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          const brandsArray = Array.isArray(data) ? data : data?.data || []
          
          if (brandsArray.length === 0) {
            setError("No brands available")
          }
          setBrands(brandsArray)
        } catch (error) {
          console.error("[v0] Error fetching brands:", error)
          setError(`Failed to load brands: ${error instanceof Error ? error.message : 'Unknown error'}`)
          setBrands([])
        } finally {
          setLoading(false)
        }
      }

      fetchBrands()
    }
  }, [step])

  // Завантаження серій при виборі бренду
  useEffect(() => {
    if (!brandSlug) return

    const fetchSeries = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/series?brand_slug=${brandSlug}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        const seriesArray = Array.isArray(data) ? data : data?.data || []
        
        // Знаходимо вибраний бренд
        const brand = brands.find(b => b.slug === brandSlug)
        if (brand) {
          setSelectedBrand(brand)
        }
        setSeries(seriesArray)
      } catch (error) {
        console.error("[v0] Error fetching series:", error)
        setSeries([])
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [brandSlug, brands])

  // Завантаження моделей при виборі серії
  useEffect(() => {
    if (!seriesSlug) return

    const fetchModels = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/models?series_slug=${seriesSlug}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        const modelsArray = Array.isArray(data) ? data : data?.data || []
        
        // Знаходимо вибрану серію
        const serie = series.find(s => s.slug === seriesSlug)
        if (serie) {
          setSelectedSeries(serie)
        }
        setModels(modelsArray)
      } catch (error) {
        console.error("[v0] Error fetching models:", error)
        setModels([])
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [seriesSlug, series])

  // Завантаження послуг при виборі моделі
  useEffect(() => {
    if (!modelSlug) return

    const fetchServices = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/model-services?model_slug=${modelSlug}&locale=${locale}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        const servicesArray = Array.isArray(data) ? data : data?.data || []
        const transformedServices = servicesArray.map((ms: any) => ({
          id: ms.id,
          service_id: ms.service_id,
          slug: ms.services?.slug || '',
          name: ms.services?.name || ms.name || 'Unknown Service',
          price: ms.price,
          warranty_months: ms.warranty_months,
          duration_hours: ms.duration_hours,
          warranty_period: ms.warranty_period,
        }))

        // Знаходимо вибрану модель
        const model = models.find(m => m.slug === modelSlug)
        if (model) {
          setSelectedModel(model)
        }
        setServices(transformedServices)
      } catch (error) {
        console.error("[v0] Error fetching services:", error)
        setServices([])
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [modelSlug, models, locale])

  // Обробка прямого завантаження з параметрів (deep link)
  useEffect(() => {
    const serviceSlug = searchParams.get("service_slug")
    const modelSlugParam = searchParams.get("model_slug")
    
    if (serviceSlug && modelSlugParam && !modelSlug) {
      setIsLoadingFromUrl(true)
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0)
      }

      const fetchModelAndService = async () => {
        try {
          const modelResponse = await fetch(`/api/admin/models?slug=${modelSlugParam}`)
          if (modelResponse.ok) {
            const modelData = await modelResponse.json()
            const modelArray = Array.isArray(modelData) ? modelData : modelData?.data || []
            if (modelArray.length > 0) {
              const model = modelArray[0]
              
              const servicesResponse = await fetch(`/api/admin/model-services?model_slug=${model.slug}&locale=${locale}`)
              if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json()
                const servicesArray = Array.isArray(servicesData) ? servicesData : servicesData?.data || []
                
                const foundService = servicesArray.find((ms: any) => 
                  (ms.services?.slug || '') === serviceSlug
                )
                
                if (foundService) {
                  const urlWarrantyMonths = searchParams.get("warranty_months")
                  const urlDurationHours = searchParams.get("duration_hours")

                  const service: Service = {
                    id: foundService.id,
                    slug: foundService.services?.slug || '',
                    name: foundService.services?.name || foundService.name || 'Unknown Service',
                    price: foundService.price,
                    warranty_months: urlWarrantyMonths ? parseInt(urlWarrantyMonths) : foundService.warranty_months,
                    duration_hours: urlDurationHours ? parseInt(urlDurationHours) : foundService.duration_hours,
                    warranty_period: foundService.warranty_period,
                  }
                  
                  setSelectedService(service)
                  setSelectedModel(model)
                  setSelectedBrand({ id: model.brand_id, name: model.brands?.name || '', slug: model.brands?.slug || '' })
                  setShowConfirmation(true)
                  
                  // Оновлюємо URL з правильними параметрами
                  updateUrl({
                    brand: model.brands?.slug || '',
                    series: model.series?.slug || null,
                    model: model.slug,
                  })
                }
              }
            }
          }
        } catch (error) {
          console.error("[v0] Error loading model/service from URL params:", error)
        } finally {
          setIsLoadingFromUrl(false)
        }
      }
      
      fetchModelAndService()
    }
  }, [searchParams, locale, modelSlug])

  const handleBrandSelect = (brand: Brand) => {
    updateUrl({ 
      brand: brand.slug,
      series: null,
      model: null,
    })
  }

  const handleSeriesSelect = (serie: Series) => {
    updateUrl({ 
      series: serie.slug,
      model: null,
    })
  }

  const handleModelSelect = (model: Model) => {
    updateUrl({ 
      model: model.slug,
    })
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setShowConfirmation(true)
  }

  const handleBack = () => {
    if (showConfirmation) {
      setShowConfirmation(false)
    } else if (step === 4) {
      updateUrl({ model: null })
    } else if (step === 3) {
      updateUrl({ series: null, model: null })
    } else if (step === 2) {
      updateUrl({ brand: null, series: null, model: null })
    } else if (step === 1) {
      router.push(`/${locale}`)
    }
  }

  // Show confirmation form if requested
  if (showConfirmation && selectedBrand && selectedModel && selectedService) {
    return (
      <BookingConfirmation
        locale={locale}
        brand={{ name: selectedBrand.name, slug: selectedBrand.slug }}
        model={{ name: selectedModel.name, slug: selectedModel.slug, id: selectedModel.id }}
        service={{
          name: selectedService.name,
          slug: selectedService.slug,
          price: selectedService.price,
          warranty_months: selectedService.warranty_months,
          duration_hours: selectedService.duration_hours,
          warranty_period: selectedService.warranty_period,
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Show loader if loading from URL params */}
        {isLoadingFromUrl ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">{t("loading") || "Loading..."}</p>
          </div>
        ) : (
          <>
        {/* Breadcrumb */}
        <nav className="mb-6">
            <Link
              href={`/${locale}`}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToHome")}
            </Link>
        </nav>

        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">{t("title")}</CardTitle>
            <p className="text-center text-gray-600 mt-2">{t("subtitle")}</p>

            {/* Progress Steps */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`w-12 h-1 mx-1 rounded transition-colors ${step > s ? "bg-blue-600" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="mt-3 flex justify-between text-xs text-gray-600">
              <span className={step === 1 ? "font-medium text-blue-600" : ""}>{t("stepBrand")}</span>
              <span className={step === 2 ? "font-medium text-blue-600" : ""}>{t("stepSeries")}</span>
              <span className={step === 3 ? "font-medium text-blue-600" : ""}>{t("stepModel")}</span>
              <span className={step === 4 ? "font-medium text-blue-600" : ""}>{t("stepService")}</span>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Back Button */}
            {step > 1 && (
              <Button variant="ghost" onClick={handleBack} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("back")}
              </Button>
            )}

            {/* Step 1: Select Brand */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">{t("selectBrand")}</h3>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                  </div>
                ) : brands.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-700 text-sm">No brands available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => handleBrandSelect(brand)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex flex-col items-center gap-2">
                          {brand.logo_url ? (
                            <img
                              src={brand.logo_url || "/placeholder.svg"}
                              alt={brand.name}
                              className="h-12 w-12 object-contain"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-xl font-bold text-gray-400">{brand.name[0]}</span>
                            </div>
                          )}
                          <span className="font-medium text-gray-900 group-hover:text-blue-600">{brand.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Series */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("selectSeries")} - {selectedBrand?.name}
                  </h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                  </div>
                ) : series.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">{t("noSeries")}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {series.map((serie) => (
                      <button
                        key={serie.id}
                        onClick={() => handleSeriesSelect(serie)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-900 group-hover:text-blue-600">{serie.name}</span>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Model */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("selectModel")} - {selectedBrand?.name}
                  </h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                  </div>
                ) : models.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">{t("noModels")}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group flex flex-col gap-3"
                      >
                        {/* Model Image */}
                        {model.image_url ? (
                          <img
                            src={model.image_url}
                            alt={model.name}
                            className="h-32 w-full object-contain bg-gray-50 rounded"
                          />
                        ) : (
                          <div className="h-32 w-full bg-gray-100 rounded flex items-center justify-center">
                            <Smartphone className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Model Name */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-gray-900 group-hover:text-blue-600 text-sm flex-1">{model.name}</span>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Select Service */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Wrench className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("selectService")} - {selectedModel?.name}
                  </h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                  </div>
                ) : services.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">{t("noServices")}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 group-hover:text-blue-600">{service.name}</h4>
                            {service.warranty_months && (
                              <p className="text-sm text-gray-600 mt-1">
                                {service.warranty_months} {t("months")}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {service.price ? (
                              <p className="font-semibold text-gray-900">{formatCurrency(service.price)}</p>
                            ) : (
                              <p className="text-gray-600">Contact us</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </>
        )}
      </div>
    </div>
  )
}
