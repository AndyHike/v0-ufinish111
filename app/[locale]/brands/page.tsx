import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Image from "next/image"
import Link from "next/link"
import { createServerClient } from "@/utils/supabase/server"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "Brands" })

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  }
}

export default async function BrandsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "Brands" })
  const supabase = createServerClient()

  // Fetch brands ordered by position
  const { data: brands } = await supabase.from("brands").select("*").order("position", { ascending: true })

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl">
        {/* Update the page title and description to be more clear about choosing a model */}
        <div className="mb-12 space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{t("chooseModelTitle")}</h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {t("chooseModelDescription")}
          </p>
        </div>

        {brands && brands.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {brands.map((brand) => (
              <Link
                href={`/${params.locale}/brands/${brand.id}`}
                key={brand.id}
                className="flex flex-col items-center rounded-lg border p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative mb-4 h-16 w-16 overflow-hidden">
                  <Image
                    src={brand.logo_url || "/placeholder.svg?height=64&width=64&query=phone+brand+logo"}
                    alt={brand.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <h2 className="text-xl font-medium">{brand.name}</h2>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center">{t("noBrandsAvailable")}</p>
        )}
      </div>
    </div>
  )
}
