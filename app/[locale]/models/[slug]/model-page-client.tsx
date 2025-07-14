"use client"

import type React from "react"
import { useEffect } from "react"

// Функція для відстеження перегляду моделі
const trackModelView = (modelData: any, locale: string) => {
  if (typeof window !== "undefined" && window.fbq) {
    const eventData = {
      content_type: "product",
      content_name: `${modelData.brands?.name} ${modelData.name}`,
      content_category: modelData.brands?.name || "Device",
      content_ids: [modelData.slug],
      value: modelData.services?.[0]?.price || 0,
      currency: "CZK",
    }

    console.log("📊 Tracking model view:", eventData)
    window.fbq("track", "ViewContent", eventData)
  }
}

interface ModelPageClientProps {
  modelData: any
  locale: string
}

const ModelPageClient: React.FC<ModelPageClientProps> = ({ modelData, locale }) => {
  useEffect(() => {
    // Example: Log model data to the console
    console.log("Model Data (Client Component):", modelData)
  }, [modelData])

  // Додай цей useEffect після інших useEffect
  useEffect(() => {
    // Відстежуємо перегляд моделі
    trackModelView(modelData, locale)
  }, [modelData, locale])

  return (
    <div>
      {/* Client-side rendering of model data */}
      <h1>{modelData?.name}</h1>
      <p>Brand: {modelData?.brands?.name}</p>
      {/* Add more client-side content here */}
    </div>
  )
}

export default ModelPageClient
