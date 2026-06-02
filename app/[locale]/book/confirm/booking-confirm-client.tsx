"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { getInitialBookingDiscountState } from "@/app/actions/booking-discounts"
import BookingConfirmation, { type CurrentUserStatus } from "../booking-confirmation"
import type { BookingDiscountChoice, BookingDiscountSummary } from "@/lib/discounts/booking-discounts"

type CurrentUser = {
    first_name?: string | null
    last_name?: string | null
    name?: string | null
    email?: string | null
    phone?: string | null
}

type InitialDiscountState = {
    discountChoice: BookingDiscountChoice
    preview: BookingDiscountSummary
    autoSelectedPersonalDiscount: boolean
}

async function fetchInitialCurrentUser(): Promise<{ user: CurrentUser | null; status: CurrentUserStatus }> {
    try {
        const response = await fetch("/api/user/current", { cache: "no-store" })
        if (!response.ok) return { user: null, status: "unknown" }

        const data = await response.json()
        return data?.user
            ? { user: data.user, status: "registered" }
            : { user: null, status: "guest" }
    } catch (error) {
        console.error("Error preloading current user:", error)
        return { user: null, status: "unknown" }
    }
}

export default function BookingConfirmClient({ locale }: { locale: string }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const t = useTranslations("StandaloneBooking")

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [brand, setBrand] = useState<{ name: string; slug: string } | null>(null)
    const [model, setModel] = useState<{ name: string; slug: string; id: string } | null>(null)
    const [initialUser, setInitialUser] = useState<CurrentUser | null>(null)
    const [initialCurrentUserStatus, setInitialCurrentUserStatus] = useState<CurrentUserStatus>("loading")
    const [initialDiscountState, setInitialDiscountState] = useState<InitialDiscountState | null>(null)
    const [service, setService] = useState<{
        id: string
        service_id?: string
        serviceId?: string
        originalPrice?: number | null
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
                const currentUserPromise = fetchInitialCurrentUser()
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
                    service_id: foundService.service_id,
                    serviceId: foundService.service_id || foundService.id,
                    originalPrice: foundService.price,
                    slug: foundService.services?.slug || "",
                    name: foundService.services?.name || foundService.name || "Unknown Service",
                    price: foundService.price,
                    warranty_months: urlWarrantyMonths ? parseInt(urlWarrantyMonths) : foundService.warranty_months,
                    duration_hours: urlDurationHours ? parseInt(urlDurationHours) : foundService.duration_hours,
                    warranty_period: foundService.warranty_period,
                }

                const initialDiscountStatePromise =
                    fetchedService.serviceId && typeof fetchedService.originalPrice === "number" && fetchedService.originalPrice > 0
                        ? getInitialBookingDiscountState({
                            serviceId: fetchedService.serviceId,
                            modelId: fetchedModel.id,
                            originalPrice: fetchedService.originalPrice,
                            locale,
                        }).catch((error) => {
                            console.error("Error preloading booking discount state:", error)
                            return null
                        })
                        : Promise.resolve(null)
                const [initialCurrentUser, discountState] = await Promise.all([
                    currentUserPromise,
                    initialDiscountStatePromise,
                ])

                setInitialUser(initialCurrentUser.user)
                setInitialCurrentUserStatus(initialCurrentUser.status)
                setInitialDiscountState(discountState)
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
            initialUser={initialUser}
            initialCurrentUserStatus={initialCurrentUserStatus}
            initialDiscountChoice={initialDiscountState?.discountChoice}
            initialDiscountPreview={initialDiscountState?.preview}
            initialAutoSelectedPersonalDiscount={initialDiscountState?.autoSelectedPersonalDiscount}
        />
    )
}
