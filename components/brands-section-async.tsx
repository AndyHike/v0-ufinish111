import { createClient } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { unstable_cache } from "next/cache"

// Кешуємо запит на 10 хвилин
const getCachedBrands = unstable_cache(
  async () => {
    const supabase = createClient()
    const { data: brands, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(20)

    if (error) {
      console.error("Error fetching brands:", error)
      return []
    }

    return brands || []
  },
  ["brands-homepage"],
  {
    revalidate: 600, // 10 хвилин
    tags: ["brands"],
  },
)

export default async function BrandsSectionAsync() {
  const brands = await getCachedBrands()

  if (!brands.length) {
    return null
  }

  return (
    <section className="py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Підтримувані бренди</h2>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
            Ми ремонтуємо пристрої найпопулярніших брендів
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/brands/${brand.slug}`}>
              <Card className="group cursor-pointer transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center space-y-2">
                    {brand.logo_url ? (
                      <div className="relative h-12 w-12">
                        <Image
                          src={brand.logo_url || "/placeholder.svg"}
                          alt={brand.name}
                          fill
                          className="object-contain transition-transform group-hover:scale-110"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">{brand.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-center">{brand.name}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
