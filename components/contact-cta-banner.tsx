"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ContactCTABannerProps {
  locale: string
  variant?: "default" | "compact"
}

export function ContactCTABanner({ locale, variant = "default" }: ContactCTABannerProps) {
  const t = useTranslations("Common")

  if (variant === "compact") {
    return (
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
        <p className="text-gray-700 mb-3 text-sm">{t("cantFindWhatYouLooking")}</p>
        <Button
          size="sm"
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-transparent"
          asChild
        >
          <Link href={`/${locale}/contact`}>
            <MessageCircle className="h-3 w-3 mr-2" />
            {t("contactUsWellHelp")}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-12 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 md:p-8 text-center">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{t("cantFindWhatYouLooking")}</h3>
      <p className="text-gray-700 mb-6 max-w-xl mx-auto">{t("contactUsDescription")}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href={`/${locale}/contact`}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {t("contactUsWellHelp")}
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-transparent"
          asChild
        >
          <a href="tel:+420775848259">
            <Phone className="h-4 w-4 mr-2" />
            +420 775 848 259
          </a>
        </Button>
      </div>
    </div>
  )
}
