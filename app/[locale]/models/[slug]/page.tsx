import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Phone, MessageCircle, Clock, Shield, ArrowRight } from "lucide-react"
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
  const t = await getTranslations({ locale, namespace: "Models" })
  const commonT = await getTranslations({ locale, namespace: "Common" })

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
          }
        })
        .filter(Boolean) || []

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container px-4 py-8 md:px-6">
          <div className="mx-auto max-w-6xl">
            {/* Breadcrumb */}
            <nav className="mb-8 text-sm text-gray-600">
              <Link href={`/${locale}/brands/${model.brands?.slug}`} className="hover:text-blue-600 transition-colors">
                {model.brands?.name}
              </Link>
              {model.series && (
                <>
                  <span className="mx-2">/</span>
                  <Link
                    href={`/${locale}/series/${model.series.slug}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {model.series.name}
                  </Link>
                </>
              )}
              <span className="mx-2">/</span>
              <span className="text-gray-900">{model.name}</span>
            </nav>

            {/* Hero Section */}
            <div className="bg-white rounded-2xl p-8 mb-12 shadow-sm border border-gray-100">
              <div className="text-center max-w-2xl mx-auto">
                <div className="mb-6">
                  <div className="relative h-32 w-32 mx-auto mb-4 overflow-hidden rounded-xl bg-gray-50">
                    <img
                      src={formatImageUrl(model.image_url) || "/placeholder.svg?height=128&width=128&query=phone"}
                      alt={model.name}
                      width={128}
                      height={128}
                      className="h-full w-full object-contain p-3"
                    />
                  </div>

                  <div className="mb-2 flex items-center justify-center gap-2">
                    {model.brands?.logo_url && (
                      <img
                        src={formatImageUrl(model.brands.logo_url) || "/placeholder.svg"}
                        alt={model.brands.name}
                        width={20}
                        height={20}
                        className="h-5 w-5 object-contain"
                      />
                    )}
                    <span className="text-gray-600 font-medium">{model.brands?.name}</span>
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{model.name}</h1>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Професійний ремонт вашого пристрою. Швидко, якісно, з гарантією.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                  <Button size="lg" className="flex-1 bg-blue-600 hover:bg-blue-700" asChild>
                    <Link href={`/${locale}/contact?model=${encodeURIComponent(model.name)}`}>
                      <Phone className="h-5 w-5 mr-2" />
                      Замовити ремонт
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 border-gray-300 hover:bg-gray-50 bg-transparent"
                    asChild
                  >
                    <Link href={`/${locale}/contact`}>
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Консультація
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Доступні послуги</h2>

              {servicesWithTranslations.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {servicesWithTranslations.map((service) => (
                    <Link
                      key={service.id}
                      href={`/${locale}/services/${service.slug}?model=${model.slug}`}
                      className="group"
                    >
                      <Card className="h-full bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1">
                        <CardContent className="p-6">
                          <div className="mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                              {service.name}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{service.description}</p>
                          </div>

                          <div className="mb-4 space-y-2">
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>від {service.duration_hours} год</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                <span>Гарантія {service.warranty_months} міс</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-gray-900">
                              {service.price ? formatCurrency(service.price) : "За запитом"}
                            </div>
                            <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                              <span className="mr-1">Детальніше</span>
                              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
                    <div className="text-gray-400 mb-4">
                      <MessageCircle className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Послуги в розробці</h3>
                    <p className="text-gray-600 mb-6">
                      Послуги для цієї моделі ще не додані або знаходяться в процесі оновлення.
                    </p>
                    <Button asChild>
                      <Link href={`/${locale}/contact?model=${encodeURIComponent(model.name)}`}>Зв'язатися з нами</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in ModelPage:", error)
    return (
      <div className="container px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Помилка завантаження</h1>
            <p className="text-gray-600">Не вдалося завантажити дані моделі. Спробуйте пізніше.</p>
            <Button asChild className="mt-4">
              <Link href={`/${locale}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                На головну
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
