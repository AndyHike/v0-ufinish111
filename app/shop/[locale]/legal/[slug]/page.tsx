import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getShopLegalPage } from "@/lib/shop/data"
import { ShopMarkdown } from "@/components/shop/shop-markdown"
import type { ShopLocale } from "@/lib/shop/types"
import { shopSiteUrl } from "@/lib/site-config"

export const revalidate = 3600

type Props = {
  params: Promise<{ locale: ShopLocale; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const page = await getShopLegalPage(slug, locale)
  if (!page) {
    return { title: "DeviceHelp Shop", robots: { index: false, follow: true } }
  }

  return {
    title: `${page.title} | DeviceHelp Shop`,
    alternates: { canonical: `${shopSiteUrl}/${locale}/legal/${slug}` },
    robots: { index: true, follow: true },
  }
}

export default async function ShopLegalRoute({ params }: Props) {
  const { locale, slug } = await params
  const page = await getShopLegalPage(slug, locale)

  if (!page) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{page.title}</h1>
      </div>
      {page.content ? (
        <ShopMarkdown className="max-w-3xl text-base leading-7 text-gray-700">{page.content}</ShopMarkdown>
      ) : (
        <p className="text-gray-500">—</p>
      )}
    </div>
  )
}
