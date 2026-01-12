"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, ChevronRight, Smartphone, Wrench } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/format-currency"

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

interface Service {
  id: string
  slug: string
  name: string
  price: number | null
}

interface Props {
  locale: string
}

export default function StandaloneBookingClient({ locale }: Props) {
  const t = useTranslations("StandaloneBooking")
  const commonT = useTranslations("Common")
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // Завантаження брендів
  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/brands?locale=${locale}`)
        const data = await response.json()
        setBrands(data)
      } catch (error) {
        console.error("Error fetching brands:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [locale])

  // Завантаження серій після вибору бренду
  useEffect(() => {
    if (!selectedBrand) return

    const fetchSeries = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/series?brand_id=${selectedBrand.id}`)
        const data = await response.json()
        console.log("[v0] Series loaded:", data)
        setSeries(data)
      } catch (error) {
        console.error("Error fetching series:", error)
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
        const data = await response.json()
        console.log("[v0] Models loaded:", data)
        setModels(data)
      } catch (error) {
        console.error("Error fetching models:", error)
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
        const response = await fetch(`/api/admin/model-services?model_id=${selectedModel.id}`)
        const data = await response.json()

        // Трансформуємо дані для відображення
        const transformedServices = data.map((ms: any) => ({
          id: ms.services.id,
          slug: ms.services.slug,
          name: ms.services.translation?.name || ms.services.name,
          price: ms.price,
        }))

        setServices(transformedServices)
      } catch (error) {
        console.error("Error fetching services:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [selectedModel])

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
    if (!selectedService || !selectedModel) return

    const params = new URLSearchParams()
    params.set("service_slug", selectedService.slug)
    params.set("model_slug", selectedModel.slug)

    router.push(`/${locale}/book-service?${params.toString()}`)
  }

  const handleBack = () => {
    if (step === 4) {
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
    }
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
            {commonT("backToHome")}
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
