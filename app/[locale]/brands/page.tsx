import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { createServerClient } from "@/utils/supabase/server"
import { Smartphone } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"

type Props = {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: "Brands" })

  return {
    title: t("allBrands"),
    description: t("allBrandsDescription"),
  }
}

export default async function BrandsPage({ params }: Props) {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: "Brands" })

  const supabase = createServerClient()

  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, position")
    .order("position", { ascending: true, nullsLast: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching brands:", error)
    return (
      <div className="container px-4 py-12 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("allBrands")}</h1>
          <p className="mt-4 text-red-500">{t("errorLoadingBrands")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("allBrands")}</h1>
          <p className="mt-4 text-muted-foreground">{t("allBrandsDescription")}</p>
        </div>

        {brands && brands.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {brands.map((brand) => (
              <Link
                href={`/${locale}/brands/${brand.slug || brand.id}`}
                key={brand.id}
                className="group flex flex-col items-center rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-slate-50 p-2 sm:h-24 sm:w-24">
                  {brand.logo_url ? (
                    <img
                      src={formatImageUrl(brand.logo_url) || "/placeholder.svg"}
                      alt={brand.name}
                      width={96}
                      height={96}
                      className="h-full w-full object-contain"
                      style={{ display: "block" }}
                    />
                  ) : (
                    <Smartphone className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <h3 className="text-center text-base font-medium group-hover:text-primary sm:text-lg">{brand.name}</h3>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-muted-foreground">{t("noBrandsAvailable")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
