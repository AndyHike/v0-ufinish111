"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Smartphone, Phone } from "lucide-react"
import { useParams } from "next/navigation"
import Image from "next/image"

export function HeroSection() {
  const t = useTranslations("Hero")
  const params = useParams()
  const locale = params.locale as string

  return (
    <section className="hero-section w-full py-6 md:py-16 lg:py-24 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:grid md:gap-6 lg:grid-cols-[1fr_450px] lg:gap-10 items-center">
          {/* Mobile Image Container (Top) & Desktop Image Container (Right) */}
          <div className="order-first md:order-last relative w-full h-[250px] md:h-[350px] rounded-xl overflow-hidden shadow-lg mb-4 md:mb-0">
            <Image
              src="/focused-phone-fix.webp"
              alt={t("imageAlt")}
              fill
              priority
              fetchPriority="high"
              className="hero-image object-cover object-center"
              sizes="(max-width: 768px) 100vw, 450px"
              quality={85}
            />
            {/* Mobile Gradient Overlay & Title (Hidden on Desktop) */}
            <div className="md:hidden absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex items-end">
              <h1 className="hero-title text-2xl font-bold tracking-tight !text-white !drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {t("title")}
              </h1>
            </div>
          </div>

          {/* Content Container */}
          <div className="flex flex-col text-center md:text-left justify-center md:space-y-4">

            {/* Desktop Title (Hidden on Mobile) */}
            <div className="hidden md:block space-y-2">
              <h1 className="hero-title text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{t("title")}</h1>
            </div>

            <p className="hero-subtitle text-gray-600 md:text-gray-500 mb-6 md:mb-0 text-base md:text-xl leading-relaxed">{t("subtitle")}</p>

            {/* Buttons / Actions */}
            <div className="flex flex-col gap-3 sm:flex-row mt-0 md:mt-4 w-full mb-6 md:mb-0">
              <Link href={`/${locale}/brands`} className="w-full sm:w-auto">
                <Button size="lg" className="btn-primary w-full shadow-md md:shadow-none bg-blue-600 hover:bg-blue-700 md:bg-primary md:hover:bg-primary/90">
                  <Smartphone className="mr-2 h-4 w-4" />
                  {t("repairMyDevice")}
                </Button>
              </Link>
              <Link href={`/${locale}/articles`} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-2 bg-white">
                  <ArrowRight className="mr-2 h-4 w-4 md:hidden" />
                  {t("articlesButton")}
                  <ArrowRight className="ml-2 h-4 w-4 hidden md:inline-block" />
                </Button>
              </Link>
              <Link href={`/${locale}/contact`} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full border-2 bg-white">
                  <Phone className="mr-2 h-4 w-4 md:hidden" />
                  {t("contactButton")}
                  <ArrowRight className="ml-2 h-4 w-4 hidden md:inline-block" />
                </Button>
              </Link>
            </div>

            {/* Features List */}
            <div className="space-y-3 text-left bg-gray-50 md:bg-transparent p-4 md:p-0 rounded-lg w-full">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 md:gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 md:text-primary flex-shrink-0" />
                  <span className="text-gray-700 md:text-gray-900 text-sm md:text-base">{t(`feature${i}`)}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
