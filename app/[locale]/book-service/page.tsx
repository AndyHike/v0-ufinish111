import { Suspense } from "react"
import { notFound } from "next/navigation"
import BookServiceClient from "./book-service-client"
import { PageHeader } from "@/components/page-header"

interface PageProps {
  params: { locale: string }
  searchParams: {
    service?: string
    brand?: string
    model?: string
    series?: string
  }
}

export default function BookServicePage({ params, searchParams }: PageProps) {
  const { service, brand, model, series } = searchParams

  // Якщо немає обов'язкових параметрів, показуємо 404
  if (!service || !brand || !model) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Бронювання послуги" description="Оберіть зручний час для ремонту вашого пристрою" />

      <Suspense fallback={<div>Завантаження...</div>}>
        <BookServiceClient service={service} brand={brand} model={model} series={series} locale={params.locale} />
      </Suspense>
    </div>
  )
}
