"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"

type Props = {
  params: {
    locale: string
    slug: string
  }
  model: any
  transformedModelServices: any[]
  t: any
  commonT: any
  backUrl: string
  backText: string
}

export default function ModelPageClient({
  params,
  model,
  transformedModelServices,
  t,
  commonT,
  backUrl,
  backText,
}: Props) {
  const { locale } = params

  // Facebook Pixel tracking for model view
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq && model) {
      window.fbq("track", "ViewContent", {
        content_type: "product",
        content_name: model.name,
        content_category: "device_model",
        brand: model.brands?.name,
        value: 0.01,
        currency: "CZK",
        device_model: model.name,
        device_brand: model.brands?.name,
        services_available: transformedModelServices?.length || 0,
      })

      // Custom event for detailed tracking
      window.fbq("trackCustom", "ModelPageView", {
        model_id: model.id,
        model_name: model.name,
        brand_name: model.brands?.name,
        series_name: model.series?.name,
        services_count: transformedModelServices?.length || 0,
        page_type: "model_detail",
      })
    }
  }, [model, transformedModelServices])

  const handleServiceClick = (service: any) => {
    if (typeof window !== "undefined" && window.fbq) {
      // Standard Facebook event
      window.fbq("track", "AddToCart", {
        content_type: "service",
        content_name: service.service.name,
        value: service.price || 0,
        currency: "CZK",
        device_model: model.name,
        device_brand: model.brands?.name,
      })

      // Custom event for detailed service tracking
      window.fbq("trackCustom", "ServiceInterest", {
        service_id: service.service.id,
        service_name: service.service.name,
        device_model: model.name,
        device_brand: model.brands?.name,
        price: service.price,
        currency: "CZK",
        action: "order_service_clicked",
      })
    }
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl">
        {/* Кнопка повернення */}
        <Link
          href={backUrl}
          className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {backText}
        </Link>

        <div className="mb-12 flex flex-col items-center gap-6 md:flex-row">
          <div className="relative h-40 w-40 overflow-hidden rounded-lg">
            <img
              src={formatImageUrl(model.image_url) || "/placeholder.svg?height=160&width=160&query=phone+model"}
              alt={model.name}
              width={160}
              height={160}
              className="h-full w-full object-contain"
              style={{ display: "block" }}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              {model.brands?.logo_url && (
                <div className="relative h-6 w-6 overflow-hidden rounded-full">
                  <img
                    src={formatImageUrl(model.brands.logo_url) || "/placeholder.svg"}
                    alt={model.brands.name}
                    width={24}
                    height={24}
                    className="h-full w-full object-contain"
                    style={{ display: "block" }}
                  />
                </div>
              )}
              <span className="text-sm text-muted-foreground">{model.brands?.name}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{model.name}</h1>
            <p className="mt-2 max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("modelPageDescription", { model: model.name, brand: model.brands?.name })}
            </p>
          </div>
        </div>

        <h2 className="mb-6 text-2xl font-bold">{t("availableServices") || "Доступні послуги"}</h2>

        {transformedModelServices && transformedModelServices.length > 0 ? (
          <div className="grid gap-4">
            {transformedModelServices.map((modelService: any) => (
              <div key={modelService.id} className="flex flex-col rounded-lg border p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-medium">{modelService.service.name}</h3>
                    <p className="mt-2 text-muted-foreground">{modelService.service.description}</p>
                  </div>
                  <div className="text-xl font-bold">
                    {modelService.price !== null ? formatCurrency(modelService.price) : t("priceOnRequest")}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" asChild onClick={() => handleServiceClick(modelService)}>
                    <Link
                      href={`/${locale}/contact?service=${encodeURIComponent(modelService.service.name)}&model=${encodeURIComponent(model.name)}`}
                    >
                      {commonT("requestService") || "Замовити послугу"}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>{t("noServicesAvailable") || "Послуги недоступні"}</p>
        )}
      </div>
    </div>
  )
}
