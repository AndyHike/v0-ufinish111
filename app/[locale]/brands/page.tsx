import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Breadcrumb } from "@/components/breadcrumb"
import { createServerClient } from "@/utils/supabase/server"
import { ArrowLeft } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { BrandSeoSections } from "@/components/brand-seo-sections"
import { siteUrl } from "@/lib/site-config"

// ISR - Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600

type Props = {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

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
    alternates: {
      canonical: `${siteUrl}/${locale}/brands`,
      languages: {
        cs: `${siteUrl}/cs/brands`,
        en: `${siteUrl}/en/brands`,
        uk: `${siteUrl}/uk/brands`,
        "x-default": `${siteUrl}/cs/brands`,
      },
    },
  }
}

export default async function BrandsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Brands" })

  const supabase = await createServerClient()

  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, position")
    .order("position", { ascending: true })

  if (error) {
    console.error("Error fetching brands:", error)
  }

  // Fetch popular services for BrandSeoSections
  const { data: topServices } = await supabase
    .from("services")
    .select(`id, slug, position, services_translations(name, locale), model_services(price)`)
    .order("position", { ascending: true })
    .limit(6)

  const seoServices = (topServices || []).map((svc: any) => {
    const tr = (svc.services_translations as any[])?.find((t: any) => t.locale === locale) ?? svc.services_translations?.[0]
    const prices = (svc.model_services as any[])?.map((ms: any) => ms.price).filter((p: any) => p != null && p > 0)
    return {
      id: svc.id,
      slug: svc.slug,
      name: tr?.name ?? svc.slug,
      minPrice: prices && prices.length > 0 ? Math.min(...prices) : null,
    }
  })

  return (
    <div className="flex flex-col min-h-screen">
      <div className="order-1 container px-4 py-12 md:px-6 md:py-24 mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[{ label: t("allBrands") || "Всі бренди", href: `/${locale}/brands` }]}
          />
        </div>

        {/* Заголовок */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("allBrands") || "Всі бренди"}</h1>
          <p className="mt-3 text-muted-foreground">
            {t("allBrandsDescription") || "Оберіть бренд вашого пристрою для професійного ремонту"}
          </p>
        </div>

        {/* Сітка брендів */}
        {brands && brands.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6 sm:gap-8 justify-items-center">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/${locale}/brands/${brand.slug || brand.id}`}
                className="group flex w-full max-w-[180px] flex-col items-center rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/20"
              >
                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-xl bg-slate-50 p-3 sm:h-28 sm:w-28 group-hover:bg-primary/5 transition-colors">
                  <img
                    src={formatImageUrl(brand.logo_url) || "/placeholder.svg?height=112&width=112&query=brand+logo"}
                    alt={brand.name}
                    width={112}
                    height={112}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                    style={{ display: "block" }}
                  />
                </div>
                <h3 className="text-center text-base font-bold text-gray-800 group-hover:text-primary sm:text-lg">{brand.name}</h3>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-lg">
            <p className="text-muted-foreground">{t("noBrandsAvailable") || "Бренди недоступні"}</p>
          </div>
        )}
      </div>

      <div className="order-2 w-full mt-12 sm:mt-16">
        <BrandSeoSections locale={locale} services={seoServices} />
      </div>

      <div className="order-3 container mx-auto px-4 pb-10 pt-4 w-full">
        <div className="mt-8 mb-8">
          <ContactCTABanner locale={locale} />
        </div>
      </div>
    </div>
  )
}
