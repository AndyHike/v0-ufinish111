import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { createServerClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Battery, Wifi, Shield, Droplet, Brush, Wrench } from "lucide-react"

type Props = {
  params: {
    locale: string
  }
}

// Icon mapping
const iconMap = {
  smartphone: Smartphone,
  battery: Battery,
  wifi: Wifi,
  shield: Shield,
  droplet: Droplet,
  brush: Brush,
  wrench: Wrench,
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params

  const titlePatterns = {
    cs: "Naše služby | DeviceHelp - Profesionální oprava mobilních telefonů",
    en: "Our Services | DeviceHelp - Professional Mobile Phone Repair",
    uk: "Наші послуги | DeviceHelp - Професійний ремонт мобільних телефонів",
  }

  const descriptionPatterns = {
    cs: "Kompletní seznam našich služeb pro opravu mobilních telefonů. Rychlé a kvalitní opravy s garancí.",
    en: "Complete list of our mobile phone repair services. Fast and quality repairs with warranty.",
    uk: "Повний список наших послуг з ремонту мобільних телефонів. Швидкий та якісний ремонт з гарантією.",
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.uk,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.uk,
  }
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: "Services" })

  const supabase = createServerClient()

  // Fetch services with translations
  const { data: services, error } = await supabase
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
    .order("position", { ascending: true })

  if (error) {
    console.error("Error fetching services:", error)
    return <div>Error loading services</div>
  }

  // Transform the data
  const transformedServices =
    services?.map((service) => ({
      id: service.id,
      position: service.position,
      slug: service.slug,
      icon: service.icon,
      name: service.services_translations[0]?.name || "",
      description: service.services_translations[0]?.description || "",
    })) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container px-4 py-12 md:py-24">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {t("title") || "Наші послуги"}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              {t("subtitle") || "Професійний ремонт мобільних пристроїв з гарантією якості"}
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {transformedServices.map((service) => {
              const IconComponent = iconMap[service.icon as keyof typeof iconMap] || Wrench
              const serviceUrl = service.slug
                ? `/${locale}/services/${service.slug}`
                : `/${locale}/services/${service.id}`

              return (
                <Link key={service.id} href={serviceUrl}>
                  <Card className="group h-full border-0 bg-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
                    <CardHeader className="pb-4">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {service.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">{service.description}</CardDescription>
                      <div className="mt-4 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {t("professional") || "Професійно"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {t("warranty") || "Гарантія"}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <span className="text-sm font-medium text-primary group-hover:underline">
                          {t("learnMore") || "Дізнатися більше"} →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <Card className="border-0 bg-primary text-primary-foreground shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold md:text-3xl">{t("ctaTitle") || "Потрібна допомога з ремонтом?"}</h2>
                <p className="mt-4 text-lg opacity-90">
                  {t("ctaDescription") || "Зв'яжіться з нами для безкоштовної консультації"}
                </p>
                <Link
                  href={`/${locale}/contact`}
                  className="mt-6 inline-flex items-center rounded-md bg-white px-6 py-3 font-medium text-primary transition-colors hover:bg-slate-100"
                >
                  {t("contactUs") || "Зв'язатися з нами"}
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
