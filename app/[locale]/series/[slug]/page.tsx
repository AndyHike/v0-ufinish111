import { createServerClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

const URL = process.env.NEXT_PUBLIC_APP_URL || "https://devicehelp.cz"

export async function generateMetadata({
  params: { slug, locale },
}: {
  params: { slug: string; locale: string }
}): Promise<Metadata> {
  const supabase = createServerClient()
  const { data: series } = await supabase
    .from("series")
    .select(`
      *,
      brands (name)
    `)
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (!series) {
    return {
      title: "Series Not Found",
    }
  }

  const title = `${series.name} - ${series.brands?.name} - DeviceHelp.cz`
  const description = `Professional repair services for ${series.name} series devices from ${series.brands?.name}. Fast and quality repair with warranty.`

  return {
    title,
    description,
    alternates: {
      canonical: `${URL}/${locale}/series/${slug}`,
      languages: {
        en: `${URL}/en/series/${slug}`,
        cs: `${URL}/cs/series/${slug}`,
        uk: `${URL}/uk/series/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${URL}/${locale}/series/${slug}`,
    },
  }
}

export default async function SeriesPage({
  params: { slug, locale },
}: {
  params: { slug: string; locale: string }
}) {
  const supabase = createServerClient()

  // Get series data with brand info
  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select(`
      *,
      brands (name, slug)
    `)
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single()

  if (seriesError || !series) {
    notFound()
  }

  // Get models for this series
  const { data: models } = await supabase
    .from("models")
    .select("*")
    .eq("series_id", series.id)
    .order("order_index", { ascending: true })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <Link href={`/${locale}/brands`} className="hover:text-foreground">
            Brands
          </Link>
          <span>/</span>
          <Link href={`/${locale}/brands/${series.brands?.slug || series.brand_id}`} className="hover:text-foreground">
            {series.brands?.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">{series.name}</span>
        </nav>
      </div>

      <PageHeader
        title={series.name}
        description={series.description || `Professional repair services for ${series.name} series devices`}
      />

      {models && models.length > 0 ? (
        <section>
          <h2 className="text-2xl font-bold mb-6">Models in this Series</h2>
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
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No models available in this series yet.</p>
        </div>
      )}
    </div>
  )
}
