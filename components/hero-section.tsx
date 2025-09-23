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
        <div className="md:hidden flex flex-col items-center text-center">
          <div className="relative w-full h-[250px] rounded-xl overflow-hidden shadow-lg mb-4">
            <Image
              src="/focused-phone-fix.webp"
              alt={t("imageAlt")}
              width={350}
              height={250}
              priority
              className="hero-image w-full h-full object-cover object-center"
              sizes="(max-width: 768px) 100vw, 350px"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
              <h1 className="hero-title text-2xl font-semibold tracking-tight text-white p-3 w-full">{t("title")}</h1>
            </div>
          </div>

          <p className="hero-subtitle text-gray-600 mb-6 text-base leading-relaxed">{t("subtitle")}</p>

          <div className="flex flex-col gap-3 w-full mb-6">
            <Link href={`/${locale}/brands`} passHref className="w-full">
              <Button size="lg" className="btn-primary w-full bg-blue-600 hover:bg-blue-700 shadow-md">
                <Smartphone className="mr-2 h-4 w-4" />
                {t("repairMyDevice")}
              </Button>
            </Link>
            <Link href={`/${locale}/contact`} passHref className="w-full">
              <Button size="lg" variant="outline" className="w-full border-2 bg-white">
                <Phone className="mr-2 h-4 w-4" />
                {t("contactButton")}
              </Button>
            </Link>
          </div>

          <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{t(`feature${i}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:grid gap-6 lg:grid-cols-[1fr_450px] lg:gap-10 items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="hero-title text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{t("title")}</h1>
              <p className="hero-subtitle text-gray-500 md:text-xl">{t("subtitle")}</p>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{t(`feature${i}`)}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row mt-4">
              <Link href={`/${locale}/brands`} passHref>
                <Button size="lg" className="btn-primary w-full sm:w-auto">
                  <Smartphone className="mr-2 h-4 w-4" />
                  {t("repairMyDevice")}
                </Button>
              </Link>
              <Link href={`/${locale}/contact`} passHref>
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white">
                  {t("contactButton")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative h-[300px] md:h-[350px] w-full rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/focused-phone-fix.webp"
              alt={t("imageAlt")}
              width={450}
              height={350}
              priority
              className="hero-image w-full h-full object-cover object-center"
              sizes="(max-width: 768px) 100vw, 450px"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          </div>
        </div>
      </div>
    </section>
  )
}
