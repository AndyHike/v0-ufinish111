"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Smartphone, Phone } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function HeroSection() {
  const t = useTranslations("Hero")
  const params = useParams()
  const locale = params.locale as string
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsLoaded(true)
    })
  }, [])

  return (
    <section className="hero-section w-full py-8 md:py-24 lg:py-32 bg-white overflow-hidden">
      <div className="container px-4 md:px-6">
        {/* Мобільна версія - спочатку фото, потім кнопки */}
        <div className="md:hidden flex flex-col items-center text-center">
          <div
            className={cn(
              "relative w-full h-[300px] rounded-xl overflow-hidden shadow-xl mb-6 transition-all duration-500 ease-out",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <Image
              src="/focused-phone-fix.webp"
              alt={t("imageAlt")}
              width={400}
              height={300}
              priority
              className="hero-image w-full h-full object-cover object-center"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <h1
                className={cn(
                  "hero-title text-3xl font-bold tracking-tighter text-white p-4 w-full transition-all duration-500 delay-100 ease-out",
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                )}
              >
                {t("title")}
              </h1>
            </div>
          </div>

          <p
            className={cn(
              "hero-subtitle text-gray-600 mb-8 text-lg transition-all duration-500 delay-200 ease-out",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            {t("subtitle")}
          </p>

          <div
            className={cn(
              "grid grid-cols-1 gap-4 w-full mb-8 transition-all duration-500 delay-300 ease-out",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            <Link href={`/${locale}/brands`} passHref className="w-full">
              <Button
                size="lg"
                className="btn-primary w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                {t("repairMyDevice")}
              </Button>
            </Link>
            <Link href={`/${locale}/contact`} passHref className="w-full">
              <Button size="lg" variant="outline" className="w-full border-2 shadow-sm bg-transparent">
                <Phone className="mr-2 h-5 w-5" />
                {t("contactButton")}
              </Button>
            </Link>
          </div>

          <div
            className={cn(
              "space-y-4 text-left bg-gray-50 p-4 rounded-lg w-full shadow-sm transition-all duration-500 delay-400 ease-out",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 transition-all duration-300 ease-out",
                  isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2",
                  { "delay-[500ms]": i === 1, "delay-[600ms]": i === 2, "delay-[700ms]": i === 3 },
                )}
              >
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{t(`feature${i}`)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Десктопна версія - з анімаціями */}
        <div className="hidden md:grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1
                className={cn(
                  "hero-title text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl transition-all duration-500 ease-out",
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                )}
              >
                {t("title")}
              </h1>
              <p
                className={cn(
                  "hero-subtitle text-gray-500 md:text-xl dark:text-gray-400 transition-all duration-500 delay-100 ease-out",
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                )}
              >
                {t("subtitle")}
              </p>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-300 ease-out",
                    isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2",
                    { "delay-[200ms]": i === 1, "delay-[300ms]": i === 2, "delay-[400ms]": i === 3 },
                  )}
                >
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{t(`feature${i}`)}</span>
                </div>
              ))}
            </div>
            <div
              className={cn(
                "flex flex-col gap-2 sm:flex-row mt-4 transition-all duration-500 delay-500 ease-out",
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
              )}
            >
              <Link href={`/${locale}/brands`} passHref>
                <Button size="lg" className="btn-primary w-full sm:w-auto">
                  <Smartphone className="mr-2 h-4 w-4" />
                  {t("repairMyDevice")}
                </Button>
              </Link>
              <Link href={`/${locale}/contact`} passHref>
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  {t("contactButton")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div
            className={cn(
              "relative h-[250px] md:h-[350px] w-full rounded-xl overflow-hidden shadow-lg transition-all duration-700 ease-out",
              isLoaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4",
            )}
          >
            <Image
              src="/focused-phone-fix.webp"
              alt={t("imageAlt")}
              width={500}
              height={350}
              priority
              className="hero-image w-full h-full object-cover object-center"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
