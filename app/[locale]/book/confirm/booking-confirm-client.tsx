"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import BookingConfirmation from "../booking-confirmation"
import { getDiscountsBatch } from "@/app/actions/discounts-api"
import { discountCache } from "@/lib/discounts/client-cache"

export default function BookingConfirmClient({ locale }: { locale: string }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const t = useTranslations("StandaloneBooking")

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [brand, setBrand] = useState<{ name: string; slug: string } | null>(null)
    const [model, setModel] = useState<{ name: string; slug: string; id: string } | null>(null)
    const [service, setService] = useState<{
        name: string
        slug: string
        price: number | null
        warranty_months?: number
        duration_hours?: number
        warranty_period?: string
    } | null>(null)

    useEffect(() => {
        const serviceSlug = searchParams.get("service_slug")
        const modelSlugParam = searchParams.get("model_slug")

        if (!serviceSlug || !modelSlugParam) {
            setError("Missing booking parameters.")
            setLoading(false)
            return
        }

        const fetchDetails = async () => {
            try {
                const modelResponse = await fetch(`/api/admin/models?slug=${modelSlugParam}`)
                if (!modelResponse.ok) throw new Error("Could not fetch model")

                const modelData = await modelResponse.json()
                const modelArray = Array.isArray(modelData) ? modelData : modelData?.data || []

                if (modelArray.length === 0) {
                    setError("Model not found")
                    setLoading(false)
                    return
                }

                const fetchedModel = modelArray[0]
                setModel({
                    id: fetchedModel.id,
                    name: fetchedModel.name,
                    slug: fetchedModel.slug
                })

                setBrand({
                    name: fetchedModel.brands?.name || "",
                    slug: fetchedModel.brands?.slug || ""
                })

                const servicesResponse = await fetch(`/api/admin/model-services?model_slug=${fetchedModel.slug}&locale=${locale}`)
                if (!servicesResponse.ok) throw new Error("Could not fetch services")

                const servicesData = await servicesResponse.json()
                const servicesArray = Array.isArray(servicesData) ? servicesData : servicesData?.data || []

                const foundService = servicesArray.find((ms: any) =>
                    (ms.services?.slug || "") === serviceSlug
                )

                if (!foundService) {
                    setError("Service not found for this model")
                    setLoading(false)
                    return
                }

                const urlWarrantyMonths = searchParams.get("warranty_months")
                const urlDurationHours = searchParams.get("duration_hours")

                const fetchedService = {
                    id: foundService.id,
                    slug: foundService.services?.slug || "",
                    name: foundService.services?.name || foundService.name || "Unknown Service",
                    price: foundService.price,
                    warranty_months: urlWarrantyMonths ? parseInt(urlWarrantyMonths) : foundService.warranty_months,
                    duration_hours: urlDurationHours ? parseInt(urlDurationHours) : foundService.duration_hours,
                    warranty_period: foundService.warranty_period,
                }

                // Apply discount check right here so BookingConfirmation receives the final price
                if (fetchedService.price !== null) {
                    const discountRequests = [{
                        serviceId: fetchedService.id,
                        modelId: fetchedModel.id,
                        originalPrice: fetchedService.price
                    }]

                    let liveDiscounts = discountCache.get(fetchedModel.id, [fetchedService.id])
                    if (!liveDiscounts) {
                        liveDiscounts = await getDiscountsBatch(discountRequests)
                        discountCache.set(fetchedModel.id, [fetchedService.id], liveDiscounts)
                    }

                    const discount = liveDiscounts[fetchedService.id]
                    if (discount && discount.discountedPrice !== null) {
                        fetchedService.price = discount.discountedPrice // Overwrite the final price the booking uses
                    }
                }

                setService(fetchedService)
            } catch (err) {
                console.error("Error fetching confirmation details:", err)
                setError("An error occurred while loading booking details.")
            } finally {
                setLoading(false)
            }
        }

        fetchDetails()
    }, [searchParams, locale])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">{t("loading") || "Loading..."}</p>
            </div>
        )
    }

    if (error || !brand || !model || !service) {
        return (
            <div className="flex flex-col items-center justify-center py-24 min-h-screen">
                <p className="text-red-600 font-medium mb-4">{error || "Failed to load booking details."}</p>
                <button
                    onClick={() => router.push(`/${locale}`)}
                    className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition"
                >
                    {t("backToHome") || "Return Home"}
                </button>
            </div>
        )
    }

    return (
        <BookingConfirmation
            locale={locale}
            brand={brand}
            model={model}
            service={service}
        />
    )
}
