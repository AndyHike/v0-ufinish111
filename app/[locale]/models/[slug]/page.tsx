import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Phone, MessageCircle, Clock, Star } from "lucide-react"
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
    // Отримуємо дані моделі
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

    // Отримуємо послуги для цієї моделі
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

    // Фільтруємо послуги з перекладами для поточної локалі
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
        <div className="container px-4 py-8 md:px-6">
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

            {/* Заголовок моделі */}
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex-shrink-0">
                <div className="relative h-48 w-48 overflow-hidden rounded-lg bg-slate-100 mx-auto md:mx-0">
                  <img
                    src={formatImageUrl(model.image_url) || "/placeholder.svg?height=192&width=192&query=phone"}
                    alt={model.name}
                    width={192}
                    height={192}
                    className="h-full w-full object-contain p-4"
                  />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
                  {model.brands?.logo_url && (
                    <img
                      src={formatImageUrl(model.brands.logo_url) || "/placeholder.svg"}
                      alt={model.brands.name}
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain"
                    />
                  )}
                  <span className="text-lg font-medium text-muted-foreground">{model.brands?.name}</span>
                </div>
                <h1 className="mb-4 text-3xl font-bold text-slate-900">{model.name}</h1>
                <p className="text-muted-foreground mb-6">
                  Професійний ремонт {model.brands?.name} {model.name}. Швидко, якісно, з гарантією.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                  <Button size="lg" asChild>
                    <Link href={`/${locale}/contact?model=${encodeURIComponent(model.name)}`}>
                      <Phone className="h-5 w-5 mr-2" />
                      Замовити ремонт
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href={`/${locale}/contact`}>
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Консультація
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Список послуг */}
            <div>
              <h2 className="mb-6 text-2xl font-bold">Доступні послуги</h2>
              {servicesWithTranslations.length > 0 ? (
                <div className="grid gap-4">
                  {servicesWithTranslations.map((service) => (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{service.name}</h3>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-muted-foreground">4.9</span>
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-3">{service.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>1-2 години</span>
                              </div>
                              <Badge variant="secondary">Гарантія 6 міс</Badge>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 ml-6">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-slate-900">
                                {service.price ? formatCurrency(service.price) : "За запитом"}
                              </div>
                            </div>
                            <Button asChild>
                              <Link href={`/${locale}/services/${service.slug}?model=${model.slug}`}>Детальніше</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
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
