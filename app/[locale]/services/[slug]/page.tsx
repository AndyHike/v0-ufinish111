import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Phone, Clock, Shield, Star, CheckCircle } from "lucide-react"
import { Smartphone, Battery, Wifi, Droplet, Brush, Wrench } from "lucide-react"

type Props = {
  params: {
    locale: string
    slug: string
  }
}

// Icon mapping
const iconMap = {
  smartphone: Smartphone,
  battery: Battery,
  wifi: Wifi,
  droplet: Droplet,
  brush: Brush,
  wrench: Wrench,
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params

  const supabase = createServerClient()

  // Try to find by slug first, then by ID
  let { data: service } = await supabase
    .from("services")
    .select(`
      id, 
      services_translations!inner(
        name,
        description,
        locale
      )
    `)
    .eq("services_translations.locale", locale)
    .eq("slug", slug)
    .single()

  if (!service) {
    const { data } = await supabase
      .from("services")
      .select(`
        id, 
        services_translations!inner(
          name,
          description,
          locale
        )
      `)
      .eq("services_translations.locale", locale)
      .eq("id", slug)
      .single()
    service = data
  }

  if (!service) {
    const titlePatterns = {
      cs: "Služba nenalezena | DeviceHelp",
      en: "Service not found | DeviceHelp",
      uk: "Послуга не знайдена | DeviceHelp",
    }

    return {
      title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.uk,
    }
  }

  const serviceName = service.services_translations[0]?.name || ""
  const serviceDescription = service.services_translations[0]?.description || ""

  const titlePatterns = {
    cs: `${serviceName} | DeviceHelp - Profesionální oprava mobilních telefonů`,
    en: `${serviceName} | DeviceHelp - Professional Mobile Phone Repair`,
    uk: `${serviceName} | DeviceHelp - Професійний ремонт мобільних телефонів`,
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.uk,
    description: serviceDescription,
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug, locale } = params
  const t = await getTranslations({ locale, namespace: "Services" })
  const commonT = await getTranslations({ locale, namespace: "Common" })

  const supabase = createServerClient()

  // Try to find by slug first, then by ID
  let { data: service, error } = await supabase
    .from("services")
    .select(`
      id, 
      position,
      slug,
      icon,
      services_translations!inner(
        name,
        description,
        locale
      )
    `)
    .eq("services_translations.locale", locale)
    .eq("slug", slug)
    .single()

  if (!service) {
    const { data, error: idError } = await supabase
      .from("services")
      .select(`
        id, 
        position,
        slug,
        icon,
        services_translations!inner(
          name,
          description,
          locale
        )
      `)
      .eq("services_translations.locale", locale)
      .eq("id", slug)
      .single()

    service = data
    error = idError
  }

  if (error || !service) {
    notFound()
  }

  const serviceName = service.services_translations[0]?.name || ""
  const serviceDescription = service.services_translations[0]?.description || ""
  const IconComponent = iconMap[service.icon as keyof typeof iconMap] || Wrench

  // Get related models that offer this service
  const { data: relatedModels } = await supabase
    .from("model_services")
    .select(`
      price,
      models(
        id,
        name,
        slug,
        image_url,
        brands(
          name,
          slug,
          logo_url
        )
      )
    `)
    .eq("service_id", service.id)
    .limit(6)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container px-4 py-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          {/* Back button */}
          <Link
            href={`/${locale}/services`}
            className="mb-6 inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:text-primary hover:shadow-md transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToServices") || "Назад до послуг"}
          </Link>

          {/* Hero Section */}
          <div className="mb-8 md:mb-12">
            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 md:h-20 md:w-20">
                    <IconComponent className="h-8 w-8 text-primary md:h-10 md:w-10" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight md:text-4xl lg:text-5xl">{serviceName}</h1>
                    <p className="mt-3 text-base text-muted-foreground md:text-lg lg:text-xl">{serviceDescription}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {t("warranty") || "Гарантія"}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {t("fastService") || "Швидко"}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" />
                        {t("professional") || "Професійно"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <Button size="lg" asChild className="w-full md:w-auto">
                      <Link href={`/${locale}/contact?service=${encodeURIComponent(serviceName)}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        {commonT("contactUs") || "Зв'язатися"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Details */}
          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="mb-6 border-0 bg-white shadow-lg md:mb-8">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">{t("serviceDetails") || "Деталі послуги"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{t("qualityParts") || "Якісні деталі"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("qualityPartsDesc") || "Використовуємо тільки оригінальні та сертифіковані деталі"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{t("fastRepair") || "Швидкий ремонт"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("fastRepairDesc") || "Більшість ремонтів виконуємо протягом 1-2 годин"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{t("warranty") || "Гарантія"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("warrantyDesc") || "Надаємо гарантію на всі види ремонту"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{t("experience") || "Досвід"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("experienceDesc") || "Багаторічний досвід роботи з різними моделями"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Models */}
              {relatedModels && relatedModels.length > 0 && (
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl md:text-2xl">
                      {t("availableForModels") || "Доступно для моделей"}
                    </CardTitle>
                    <CardDescription>
                      {t("availableForModelsDesc") || "Ця послуга доступна для наступних моделей пристроїв"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {relatedModels.slice(0, 6).map((modelService: any) => (
                        <Link
                          key={modelService.models.id}
                          href={`/${locale}/models/${modelService.models.slug || modelService.models.id}`}
                          className="group rounded-lg border p-4 transition-all hover:border-primary hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                              <img
                                src={modelService.models.image_url || "/placeholder.svg?height=48&width=48&query=phone"}
                                alt={modelService.models.name}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                {modelService.models.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {modelService.models.brands?.name}
                              </p>
                              {modelService.price && (
                                <p className="text-sm font-medium text-primary">від {modelService.price} ₴</p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{t("needHelp") || "Потрібна допомога?"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("contactDescription") || "Зв'яжіться з нами для отримання консультації або запису на ремонт"}
                  </p>
                  <Button className="w-full" asChild>
                    <Link href={`/${locale}/contact?service=${encodeURIComponent(serviceName)}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      {commonT("contactUs") || "Зв'язатися"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Process Card */}
              <Card className="border-0 bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{t("repairProcess") || "Процес ремонту"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t("step1") || "Діагностика"}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("step1Desc") || "Безкоштовна діагностика пристрою"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t("step2") || "Узгодження"}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("step2Desc") || "Узгодження вартості та термінів"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t("step3") || "Ремонт"}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("step3Desc") || "Професійний ремонт пристрою"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        4
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t("step4") || "Тестування"}</p>
                        <p className="text-xs text-muted-foreground">{t("step4Desc") || "Перевірка якості ремонту"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
