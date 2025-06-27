import { createServerClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format-currency"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"

const URL = process.env.NEXT_PUBLIC_APP_URL || "https://devicehelp.cz"

export async function generateMetadata({
  params: { slug, locale },
}: {
  params: { slug: string; locale: string }
}): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: model } = await supabase
    .from("models")
    .select(`
      *,
      brands (name),
      series (name)
    `)
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!model) {
    return {
      title: "Model Not Found",
    }
  }

  const title = `${model.name} Repair - DeviceHelp.cz`
  const description = `Professional repair services for ${model.name}. Screen replacement, battery replacement and more with warranty.`

  return {
    title,
    description,
    alternates: {
      canonical: `${URL}/${locale}/models/${slug}`,
      languages: {
        en: `${URL}/en/models/${slug}`,
        cs: `${URL}/cs/models/${slug}`,
        uk: `${URL}/uk/models/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${URL}/${locale}/models/${slug}`,
    },
  }
}

export default async function ModelPage({
  params: { slug, locale },
}: {
  params: { slug: string; locale: string }
}) {
  const supabase = createServerClient()
  const t = await getTranslations("Services")

  // Get model data with brand and series info
  const { data: model, error: modelError } = await supabase
    .from("models")
    .select(`
      *,
      brands (name, slug),
      series (name, slug)
    `)
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (modelError || !model) {
    notFound()
  }

  // Get services for this model
  const { data: services } = await supabase
    .from("model_services")
    .select(`
      *,
      services (name, description)
    `)
    .eq("model_id", model.id)
    .order("created_at", { ascending: true })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <Link href={`/${locale}/brands`} className="hover:text-foreground">
            Brands
          </Link>
          <span>/</span>
          <Link href={`/${locale}/brands/${model.brands?.slug || model.brand_id}`} className="hover:text-foreground">
            {model.brands?.name}
          </Link>
          {model.series && (
            <>
              <span>/</span>
              <Link
                href={`/${locale}/series/${model.series.slug || model.series_id}`}
                className="hover:text-foreground"
              >
                {model.series.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{model.name}</span>
        </nav>
      </div>

      <PageHeader
        title={model.name}
        description={model.description || `Professional repair services for ${model.name}`}
      />

      {services && services.length > 0 ? (
        <section>
          <h2 className="text-2xl font-bold mb-6">Available Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {service.services?.name || service.service_name}
                    {service.price && <Badge variant="outline">{formatCurrency(service.price)}</Badge>}
                  </CardTitle>
                  {(service.services?.description || service.description) && (
                    <CardDescription>{service.services?.description || service.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Book Repair</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No services available for this model yet.</p>
          <Button asChild className="mt-4">
            <Link href={`/${locale}/contact`}>Contact Us for Custom Quote</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
