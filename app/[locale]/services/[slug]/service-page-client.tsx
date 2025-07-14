"use client"

import type React from "react"

import { useEffect } from "react"

// Функція для відстеження перегляду послуги
const trackServiceView = (serviceData: any, locale: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    const eventData = {
      content_type: "service",
      content_name: serviceData.translation.name,
      content_category: "Repair Service",
      content_ids: [serviceData.slug],
      value: serviceData.modelServicePrice || serviceData.minPrice || 0,
      currency: "CZK",
    }

    // Додаємо інформацію про модель якщо є
    if (serviceData.sourceModel) {
      eventData.content_name = `${serviceData.translation.name} - ${serviceData.sourceModel.brands?.name} ${serviceData.sourceModel.name}`
      eventData.content_category = `${serviceData.sourceModel.brands?.name} Repair`
      eventData.content_ids = [`${serviceData.slug}-${serviceData.sourceModel.slug}`]
    }

    console.log("📊 Tracking service view:", eventData)
    window.fbq("track", "ViewContent", eventData)
  }
}

interface ServicePageClientProps {
  serviceData: any
  locale: string
}

const ServicePageClient: React.FC<ServicePageClientProps> = ({ serviceData, locale }) => {
  // Додай цей useEffect після інших useEffect
  useEffect(() => {
    // Відстежуємо перегляд послуги
    trackServiceView(serviceData, locale)
  }, [serviceData, locale])

  return (
    <div>
      {/* Your component content here, using serviceData and locale */}
      <h1>{serviceData?.translation?.name}</h1>
      {/* Example: Displaying service description */}
      <p>{serviceData?.translation?.description}</p>
    </div>
  )
}

export default ServicePageClient
