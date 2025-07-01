import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"
import { createCachedSupabaseClient } from "@/lib/cache/supabase-cache"

type Props = {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params

  const titlePatterns = {
    cs: "Značky zařízení | DeviceHelp",
    en: "Device Brands | DeviceHelp",
    uk: "Бренди пристроїв | DeviceHelp",
  }

  const descriptionPatterns = {
    cs: "Vyberte značku vašeho zařízení pro profesionální opravu. Podporujeme všechny hlavní značky mobilních telefonů a tabletů.",
    en: "Choose your device brand for professional repair. We support all major mobile phone and tablet brands.",
    uk: "Оберіть бренд вашого пристрою для професійного ремонту. Ми підтримуємо всі основні бренди мобільних телефонів та планшетів.",
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
  }
}

export default async function BrandsPage({ params }: Props) {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: "Brands" })

  // Використовуємо кешований клієнт замість звичайного
  const cachedSupabase = createCachedSupabaseClient()
  const brands = await cachedSupabase.getBrands()

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Кнопка повернення на головну */}
        <Link
          href={`/${locale}`}
          className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToHome") || "На головну"}
        </Link>

        {/* Заголовок */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("allBrands") || "Всі бренди"}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("brandsPageDescription") || "Оберіть бренд вашого пристрою для професійного ремонту"}
          </p>
        </div>

        {/* Сітка брендів */}
        {brands && brands.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/${locale}/brands/${brand.slug || brand.id}`}
                className="group flex flex-col items-center rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-slate-50 p-3">
                  <img
                    src={formatImageUrl(brand.logo_url) || "/placeholder.svg?height=64&width=64&query=brand+logo"}
                    alt={brand.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-contain"
                    style={{ display: "block" }}
                  />
                </div>
                <h3 className="text-center text-sm font-medium group-hover:text-primary">{brand.name}</h3>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-muted-foreground">{t("noBrandsAvailable") || "Бренди недоступні"}</p>
          </div>
        )}
      </div>
    </div>
  )
}
