import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Phone, MessageCircle, Clock, Star, ArrowRight } from "lucide-react"
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
          }
        })
        .filter(Boolean) || []

    return (
      <div className="min-h-screen bg-white">
        <div className="container px-4 py-6 md:px-6">
          <div className="mx-auto max-w-4xl">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link href={`/${locale}/brands/${model.brands?.slug}`} className="hover:text-primary">
                {model.brands?.name}
              </Link>
              {model.series && (
                <>
                  <span className="mx-2">/</span>
                  <Link href={`/${locale}/series/${model.series.slug}`} className="hover:text-primary">
                    {model.series.name}
                  </Link>
                </>
              )}
              <span className="mx-2">/</span>
              <span className="text-foreground">{model.name}</span>
            </nav>

            {/* Заголовок моделі - Компактний */}
            <div className="mb-8 text-center">
              <div className="mb-4">
                <div className="relative h-32 w-32 mx-auto overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                  <img
                    src={formatImageUrl(model.image_url) || "/placeholder.svg?height=128&width=128&query=phone"}
                    alt={model.name}
                    width={128}
                    height={128}
                    className="h-full w-full object-contain p-3"
                  />
                </div>
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
                <span className="text-muted-foreground">{model.brands?.name}</span>
              </div>

              <h1 className="mb-3 text-2xl font-bold text-slate-900">{model.name}</h1>

              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Професійний ремонт {model.brands?.name} {model.name}. Швидко, якісно, з гарантією.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center max-w-sm mx-auto">
                <Button className="flex-1" asChild>
                  <Link href={`/${locale}/contact?model=${encodeURIComponent(model.name)}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Замовити ремонт
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" asChild>
                  <Link href={`/${locale}/contact`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Консультація
                  </Link>
                </Button>
              </div>
            </div>

            {/* Список послуг - Мінімалістичний */}
            <div>
              <h2 className="mb-6 text-xl font-bold text-center">Доступні послуги</h2>
              {servicesWithTranslations.length > 0 ? (
                <div className="space-y-3">
                  {servicesWithTranslations.map((service) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{service.name}</h3>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-muted-foreground">4.9</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{service.description}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>1-2 год</span>
                              </div>
                              <Badge variant="secondary" className="text-xs px-2 py-0">
                                Гарантія 6 міс
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <div className="text-right">
                              <div className="font-bold text-slate-900">
                                {service.price ? formatCurrency(service.price) : "За запитом"}
                              </div>
                            </div>
                            <Button size="sm" asChild>
                              <Link href={`/${locale}/services/${service.slug}?model=${model.slug}`}>
                                Детальніше
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Послуги для цієї моделі ще не додані або знаходяться в процесі оновлення.
                    </p>
                    <Button asChild>
                      <Link href={`/${locale}/contact?model=${encodeURIComponent(model.name)}`}>Зв'язатися з нами</Link>
                    </Button>
                  </CardContent>
                </Card>
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
            <p className="text-slate-600">Не вдалося завантажити дані моделі. Спробуйте пізніше.</p>
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
