"use client"

import { useTranslations, useLocale } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Brand } from "@/lib/data/brands"

interface BrandsSectionProps {
  data: Brand[]
}

export function BrandsSection({ data: brands }: BrandsSectionProps) {
  const t = useTranslations("BrandsSection")
  const locale = useLocale()

  // Determine if we should center the brands (when there are few)
  const shouldCenterBrands = brands.length <= 3

  return (
    <section className="py-12 bg-gray-50">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">{t("title")}</h2>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">{t("description")}</p>

        {brands.length > 0 ? (
          <>
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <div
                  className="flex gap-4 pb-4"
                  style={{
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                    minWidth: "fit-content",
                  }}
                >
                  {brands.map((brand) => (
                    <div key={brand.id} className="flex-none w-[140px]">
                      <Link href={`/${locale}/brands/${brand.slug || brand.id}`}>
                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 h-28">
                          <CardContent className="p-3 flex flex-col items-center justify-center h-full">
                            {brand.logo_url ? (
                              <div className="relative h-12 w-full">
                                <Image
                                  src={brand.logo_url || "/placeholder.svg"}
                                  alt={brand.name}
                                  width={100}
                                  height={60}
                                  className="object-contain mx-auto"
                                  style={{ maxHeight: "100%", width: "auto" }}
                                />
                              </div>
                            ) : (
                              <div className="text-sm font-medium text-center">{brand.name}</div>
                            )}
                            <span className="mt-1 text-xs text-center line-clamp-2 leading-tight">{brand.name}</span>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block relative max-w-4xl mx-auto">
              <div
                className={`flex gap-6 pb-4 ${shouldCenterBrands ? "justify-center" : "overflow-x-auto scrollbar-hide"}`}
              >
                {brands.map((brand) => (
                  <div key={brand.id} className="flex-none w-[200px]">
                    <Link href={`/${locale}/brands/${brand.slug || brand.id}`}>
                      <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 h-32">
                        <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                          {brand.logo_url ? (
                            <div className="relative h-16 w-full">
                              <Image
                                src={brand.logo_url || "/placeholder.svg"}
                                alt={brand.name}
                                width={120}
                                height={80}
                                className="object-contain mx-auto"
                                style={{ maxHeight: "100%", width: "auto" }}
                              />
                            </div>
                          ) : (
                            <div className="text-lg font-medium">{brand.name}</div>
                          )}
                          <span className="mt-2 text-sm text-center">{brand.name}</span>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">{t("noBrands")}</p>
        )}

        <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link href={`/${locale}/brands`}>{t("allBrandsButton")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
