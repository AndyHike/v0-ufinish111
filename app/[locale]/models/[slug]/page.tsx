import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Clock, Shield, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"

type Props = {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params
  const supabase = createServerClient()

  const { data: model } = await supabase
    .from("models")
    .select(`
      id,
      name,
      brands(
        name
      )
    `)
    .eq("slug", slug)
    .single()

  if (!model) {
    return {
      title: "Model not found | DeviceHelp",
      description: "The requested model could not be found.",
    }
  }

  return {
    title: `${model.brands?.name} ${model.name} | DeviceHelp`,
    description: `Professional repair services for ${model.brands?.name} ${model.name}. Fast, reliable, and affordable.`,
  }
}

export default async function ModelPage({ params }: Props) {
  const { slug, locale } = params

  const supabase = createServerClient()

  try {
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select(`
        id,
        name,
        slug,
        image_url,
        brands(
          id,
          name,
          slug,
          logo_url
        ),
        series(
          id,
          name,
          slug
        )
      `)
      .eq("slug", slug)
      .single()

    if (modelError || !model) {
      notFound()
    }

    const { data: modelServices } = await supabase
      .from("model_services")
      .select(`
        id,
        price,
        services(
          id,
          slug,
          position,
          warranty_months,
          duration_hours,
          image_url,
          services_translations(
            name,
            description,
            locale
          )
        )
      `)
      .eq("model_id", model.id)
      .order("services(position)")

    const servicesWithTranslations =
      modelServices
        ?.map((ms) => {
          const service = ms.services
          if (!service) return null

          const translation = service.services_translations?.find((t: any) => t.locale === locale)
          if (!translation) return null

          return {
            id: service.id,
            slug: service.slug,
            name: translation.name,
            description: translation.description,
            price: ms.price,
            position: service.position,
            warranty_months: service.warranty_months,
            duration_hours: service.duration_hours,
            image_url: service.image_url,
          }
        })
        .filter(Boolean) || []

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-gray-500">
            <Link href={`/${locale}/brands/${model.brands?.slug}`} className="hover:text-blue-600 transition-colors">
              {model.brands?.name}
            </Link>
            {model.series && (
              <>
                <span className="mx-2">/</span>
                <Link href={`/${locale}/series/${model.series.slug}`} className="hover:text-blue-600 transition-colors">
                  {model.series.name}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-gray-900">{model.name}</span>
          </nav>

          {/* Hero Section - Тільки ідентифікація пристрою */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <div className="relative h-48 w-48 mx-auto mb-6 overflow-hidden rounded-2xl bg-gray-50 shadow-sm">
                <img
                  src={formatImageUrl(model.image_url) || "/placeholder.svg?height=192&width=192&query=phone"}
                  alt={model.name}
                  width={192}
                  height={192}
                  className="h-full w-full object-contain p-6"
                />
              </div>

              <div className="mb-4 flex items-center justify-center gap-3">
                {model.brands?.logo_url && (
                  <img
                    src={formatImageUrl(model.brands.logo_url) || "/placeholder.svg"}
                    alt={model.brands.name}
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                )}
                <span className="text-gray-600 font-medium text-lg">{model.brands?.name}</span>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">{model.name}</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Професійний ремонт вашого пристрою від досвідчених майстрів
              </p>
            </div>
          </div>

          {/* Services Grid */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Доступні послуги</h2>

            {servicesWithTranslations.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {servicesWithTranslations.map((service) => (
                  <Link
                    key={service.id}
                    href={`/${locale}/services/${service.slug}?model=${model.slug}`}
                    className="group block"
                  >
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 group-hover:-translate-y-2">
                      {/* Service Image */}
                      <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        {service.image_url ? (
                          <img
                            src={formatImageUrl(service.image_url) || "/placeholder.svg"}
                            alt={service.name}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <div className="w-8 h-8 bg-blue-600 rounded-sm"></div>
                            </div>
                            <p className="text-gray-500 font-medium">{service.name}</p>
                          </div>
                        )}
                      </div>

                      {/* Service Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                          {service.name}
                        </h3>

                        {/* Key Benefits */}
                        <div className="mb-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span>від {service.duration_hours} години</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span>Гарантія {service.warranty_months} місяців</span>
                          </div>
                        </div>

                        {/* Price and CTA */}
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-gray-900">
                            {service.price ? formatCurrency(service.price) : "За запитом"}
                          </div>
                          <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                            <span className="mr-2">Детальніше</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-8 h-8 bg-gray-400 rounded-sm"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Послуги в розробці</h3>
                  <p className="text-gray-600 mb-8">
                    Послуги для цієї моделі ще не додані або знаходяться в процесі оновлення.
                  </p>
                  <Link
                    href={`/${locale}/contact?model=${encodeURIComponent(model.name)}`}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Зв'язатися з нами
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in ModelPage:", error)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Помилка завантаження</h1>
          <p className="text-gray-600 mb-6">Не вдалося завантажити дані моделі. Спробуйте пізніше.</p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            На головну
          </Link>
        </div>
      </div>
    )
  }
}
