"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
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
}

interface Service {
  id: string
  name: string
  slug: string
  price: number | null
}

interface StandaloneBookingClientProps {
  locale: string
}

export default function StandaloneBookingClient({ locale }: StandaloneBookingClientProps) {
  const t = useTranslations("StandaloneBooking")
  const searchParams = useSearchParams()
  
  const [step, setStep] = useState(1)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)

  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // Завантаження брендів з URL параметрів
  useEffect(() => {
    const serviceSlug = searchParams.get("service_slug")
    const modelSlug = searchParams.get("model_slug")
    
    // Перевіряємо, чи є збережений стан у sessionStorage
    const savedState = typeof window !== 'undefined' ? sessionStorage.getItem('bookingState') : null
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        setStep(state.step)
        setSelectedBrand(state.selectedBrand)
        setSelectedSeries(state.selectedSeries)
        setSelectedModel(state.selectedModel)
        setSelectedService(state.selectedService)
        setShowConfirmation(state.showConfirmation)
      } catch (error) {
        console.error("[v0] Error restoring booking state:", error)
      }
    } else if (serviceSlug && modelSlug) {
      // Якщо є параметри в URL, переходимо прямо на крок 4
      setStep(4)
      setShowConfirmation(true)
      
      // Завантажуємо модель та послугу
      const fetchModelAndService = async () => {
        try {
          // Завантажуємо модель
          const modelResponse = await fetch(`/api/admin/models?slug=${modelSlug}`)
          if (modelResponse.ok) {
            const modelData = await modelResponse.json()
            const modelArray = Array.isArray(modelData) ? modelData : modelData?.data || []
            if (modelArray.length > 0) {
              const model = modelArray[0]
              setSelectedModel(model)
              setSelectedBrand({ id: model.brand_id, name: model.brands?.name || '', slug: model.brands?.slug || '' })
              
              // Завантажуємо послуги для моделі
              const servicesResponse = await fetch(`/api/admin/model-services?model_id=${model.id}&locale=${locale}`)
              if (servicesResponse.ok) {
                const servicesData = await servicesResponse.json()
                const servicesArray = Array.isArray(servicesData) ? servicesData : servicesData?.data || []
                
                // Шукаємо послугу за slug
                const foundService = servicesArray.find((ms: any) => 
                  (ms.services?.slug || '') === serviceSlug
                )
                
                if (foundService) {
                  const service: Service = {
                    id: foundService.services?.id || foundService.service_id,
                    slug: foundService.services?.slug || '',
                    name: foundService.services?.name || foundService.name || 'Unknown Service',
                    price: foundService.price,
                  }
                  setSelectedService(service)
                }
              }
            }
          }
        } catch (error) {
          console.error("[v0] Error loading model/service from URL params:", error)
        }
      }
      
      fetchModelAndService()
    } else {
      // Завантажуємо бренди
      const fetchBrands = async () => {
        setLoading(true)
        try {
          const response = await fetch(`/api/brands?locale=${locale}`)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          setBrands(Array.isArray(data) ? data : data?.data || [])
        } catch (error) {
          console.error("Error fetching brands:", error)
          setBrands([])
        } finally {
          setLoading(false)
        }
      }

      fetchBrands()
    }
  }, [searchParams, locale])

  // Збереження стану в sessionStorage коли він змінюється
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = {
        step,
        selectedBrand,
        selectedSeries,
        selectedModel,
        selectedService,
        showConfirmation,
      }
      sessionStorage.setItem('bookingState', JSON.stringify(state))
    }
  }, [step, selectedBrand, selectedSeries, selectedModel, selectedService, showConfirmation])
  useEffect(() => {
    if (!selectedBrand) return

    const fetchSeries = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/series?brand_id=${selectedBrand.id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log("[v0] Series loaded:", data)
        setSeries(Array.isArray(data) ? data : data?.data || [])
      } catch (error) {
        console.error("Error fetching series:", error)
        setSeries([])
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [selectedBrand])

  // Завантаження моделей після вибору серії
  useEffect(() => {
    if (!selectedSeries) return

    const fetchModels = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/models?series_id=${selectedSeries.id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log("[v0] Models loaded:", data)
        setModels(Array.isArray(data) ? data : data?.data || [])
      } catch (error) {
        console.error("Error fetching models:", error)
        setModels([])
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [selectedSeries])

  // Завантаження послуг після вибору моделі
  useEffect(() => {
    if (!selectedModel) return

    const fetchServices = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/model-services?model_id=${selectedModel.id}&locale=${locale}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log("[v0] Services loaded:", data)

        // Трансформуємо дані для відображення
        const servicesArray = Array.isArray(data) ? data : data?.data || []
        const transformedServices = servicesArray.map((ms: any) => ({
          id: ms.services?.id || ms.service_id,
          slug: ms.services?.slug || '',
          name: ms.services?.name || ms.name || 'Unknown Service',
          price: ms.price,
        }))

        console.log("[v0] Transformed services:", transformedServices)
        setServices(transformedServices)
      } catch (error) {
        console.error("[v0] Error fetching services:", error)
        setServices([])
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [selectedModel, locale])

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand)
    setSelectedSeries(null)
    setSelectedModel(null)
    setSelectedService(null)
    setStep(2)
  }

  const handleSeriesSelect = (serie: Series) => {
    setSelectedSeries(serie)
    setSelectedModel(null)
    setSelectedService(null)
    setStep(3)
  }

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model)
    setSelectedService(null)
    setStep(4)
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
  }

  const handleProceedToBooking = () => {
    if (!selectedService || !selectedModel || !selectedBrand) {
      alert("Please select a service before proceeding")
      return
    }
    setShowConfirmation(true)
  }

  const handleBack = () => {
    if (showConfirmation) {
      setShowConfirmation(false)
    } else if (step === 4) {
      setStep(3)
      setSelectedService(null)
    } else if (step === 3) {
      setStep(2)
      setSelectedModel(null)
      setSelectedService(null)
    } else if (step === 2) {
      setStep(1)
      setSelectedSeries(null)
      setSelectedModel(null)
      setSelectedService(null)
    } else if (step === 1) {
      // Очищуємо sessionStorage при повертанні на крок 1
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('bookingState')
      }
      setSelectedBrand(null)
      setSelectedSeries(null)
      setSelectedModel(null)
      setSelectedService(null)
    }
  }

  const handleConfirmationBack = () => {
    setShowConfirmation(false)
    // Очищуємо sessionStorage коли виходимо з confirmation форми
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bookingState')
    }
  }

  // Show confirmation form if requested
  if (showConfirmation && selectedBrand && selectedModel && selectedService) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleConfirmationBack} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back")}
        </Button>
        <BookingConfirmation
          locale={locale}
          brand={{ name: selectedBrand.name, slug: selectedBrand.slug }}
          model={{ name: selectedModel.name, slug: selectedModel.slug }}
          service={{
            name: selectedService.name,
            slug: selectedService.slug,
            price: selectedService.price,
          }}
          onBack={handleConfirmationBack}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
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

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
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
                    {t("selectModel")} - {selectedSeries?.name}
                  </h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                  </div>
                ) : models.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">{t("noModels")}</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleModelSelect(model)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex flex-col items-center gap-2">
                          {model.image_url ? (
                            <img
                              src={model.image_url || "/placeholder.svg"}
                              alt={model.name}
                              className="h-16 w-16 object-contain"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Smartphone className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900 group-hover:text-blue-600 text-center text-sm">
                            {model.name}
                          </span>
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
                    <span className="ml-2 text-gray-600">{t("loading")}</span>
                  </div>
                ) : services.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">{t("noServices")}</p>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                          selectedService?.id === service.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{service.name}</p>
                            {service.price && (
                              <p className="text-sm text-gray-600 mt-1">{formatCurrency(service.price)}</p>
                            )}
                          </div>
                          {selectedService?.id === service.id && (
                            <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <ChevronRight className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedService && (
                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      onClick={handleProceedToBooking}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium"
                      size="lg"
                    >
                      {t("proceedToBooking")}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
