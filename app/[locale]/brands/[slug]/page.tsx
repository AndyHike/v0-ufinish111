import { createServerClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const { data: brand } = await supabase.from("brands").select("*").or(`slug.eq.${slug},id.eq.${slug}`).single()

  if (!brand) {
    return {
      title: "Brand Not Found",
    }
  }

  const title = `${brand.name} - DeviceHelp.cz`
  const description = `Professional repair services for ${brand.name} devices. Fast and quality repair with warranty.`

  return {
    title,
    description,
    alternates: {
      canonical: `${URL}/${locale}/brands/${slug}`,
      languages: {
        en: `${URL}/en/brands/${slug}`,
        cs: `${URL}/cs/brands/${slug}`,
        uk: `${URL}/uk/brands/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${URL}/${locale}/brands/${slug}`,
    },
  }
}

export default async function BrandPage({
  params: { slug, locale },
}: {
  params: { slug: string; locale: string }
}) {
  const supabase = createServerClient()
  const t = await getTranslations("Brands")

  // Get brand data
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (brandError || !brand) {
    notFound()
  }

  // Get series for this brand
  const { data: series } = await supabase
    .from("series")
    .select("*")
    .eq("brand_id", brand.id)
    .order("order_index", { ascending: true })

  // Get models for this brand
  const { data: models } = await supabase
    .from("models")
    .select("*")
    .eq("brand_id", brand.id)
    .order("order_index", { ascending: true })

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={brand.name}
        description={brand.description || `Professional repair services for ${brand.name} devices`}
      />

      {series && series.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Series</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {item.name}
                    <Badge variant="secondary">{item.models_count || 0} models</Badge>
                  </CardTitle>
                  {item.description && <CardDescription>{item.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/${locale}/series/${item.slug || item.id}`}>View Models</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {models && models.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">All Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <Card key={model.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{model.name}</CardTitle>
                  {model.description && <CardDescription>{model.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={`/${locale}/models/${model.slug || model.id}`}>View Services</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {(!series || series.length === 0) && (!models || models.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No models available for this brand yet.</p>
        </div>
      )}
    </div>
  )
}
