import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Smartphone, Battery, Wifi, Shield, Brush, Droplet, Clock, CreditCard, Award, ChevronRight } from "lucide-react"

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "Services" })

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  }
}

export default async function ServicesPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "Services" })
  const commonT = await getTranslations({ locale: params.locale, namespace: "Common" })

  // Define all services with translation keys
  const services = [
    {
      id: "screen-replacement",
      icon: Smartphone,
      translationKey: "screenReplacement",
      color: "from-blue-500 to-blue-600",
      lightColor: "bg-blue-50",
      image: "/phone-repair-close-up.png",
    },
    {
      id: "battery-replacement",
      icon: Battery,
      translationKey: "batteryReplacement",
      color: "from-green-500 to-green-600",
      lightColor: "bg-green-50",
      image: "/focused-phone-fix.png",
    },
    {
      id: "board-repair",
      icon: Wifi,
      translationKey: "boardRepair",
      color: "from-purple-500 to-purple-600",
      lightColor: "bg-purple-50",
      image: "/smartphone-repair-close-up.png",
    },
    {
      id: "screen-protection",
      icon: Shield,
      translationKey: "screenProtection",
      color: "from-amber-500 to-amber-600",
      lightColor: "bg-amber-50",
      image: "/sleek-slate-iphone.png",
    },
    {
      id: "phone-cleaning",
      icon: Brush,
      translationKey: "phoneCleaning",
      color: "from-teal-500 to-teal-600",
      lightColor: "bg-teal-50",
      image: "/phantom-violet-s21.png",
    },
    {
      id: "water-damage-repair",
      icon: Droplet,
      translationKey: "waterDamageRepair",
      color: "from-cyan-500 to-cyan-600",
      lightColor: "bg-cyan-50",
      image: "/redmi-note-10-on-desk.png",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="container px-4 py-12 md:py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">{t("pageTitle")}</h1>
            <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto">{t("pageDescription")}</p>
          </div>
        </div>
      </div>

      {/* Services grid */}
      <div className="container px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service) => {
            const IconComponent = service.icon
            return (
              <div
                key={service.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100"
              >
                {/* Service image */}
                <div className="relative h-48 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-r ${service.color} opacity-90`}></div>
                  <Image
                    src={service.image || "/placeholder.svg"}
                    alt={t(`${service.translationKey}.name`)}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <h2 className="text-xl font-bold text-white">{t(`${service.translationKey}.name`)}</h2>
                  </div>
                </div>

                {/* Service content */}
                <div className="p-5 flex-grow flex flex-col">
                  <p className="text-gray-600 text-sm mb-4">{t(`${service.translationKey}.shortDescription`)}</p>

                  {/* Service features */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {t("timeLabel")}:{" "}
                        <span className="font-medium">{t(`${service.translationKey}.estimatedTime`)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {t("priceLabel")}:{" "}
                        <span className="font-medium">{t(`${service.translationKey}.priceRange`)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {t("warrantyLabel")}:{" "}
                        <span className="font-medium">{t(`${service.translationKey}.warranty`)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-auto">
                    <Button
                      asChild
                      className={`w-full rounded-xl bg-gradient-to-r ${service.color} hover:opacity-90 transition-opacity`}
                    >
                      <Link
                        href={`/${params.locale}/contact?service=${encodeURIComponent(t(`${service.translationKey}.name`))}`}
                        className="flex items-center justify-center gap-2"
                      >
                        {t("requestService")}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container px-4 py-12 md:py-20 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            {t("faqTitle") || "Frequently Asked Questions"}
          </h2>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-lg mb-2">
                {t("faq1.question") || "How long does a typical repair take?"}
              </h3>
              <p className="text-gray-600">
                {t("faq1.answer") ||
                  "Most repairs are completed within 1-2 hours. Complex repairs might take up to 24 hours. We'll always provide you with an estimated completion time when you drop off your device."}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-lg mb-2">
                {t("faq2.question") || "Do you offer warranty on repairs?"}
              </h3>
              <p className="text-gray-600">
                {t("faq2.answer") ||
                  "Yes, all our repairs come with a warranty. Screen replacements have a 6-month warranty, while other repairs typically have a 3-month warranty against defects in parts or workmanship."}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-lg mb-2">
                {t("faq3.question") || "What payment methods do you accept?"}
              </h3>
              <p className="text-gray-600">
                {t("faq3.answer") ||
                  "We accept cash, credit/debit cards, and mobile payment options. For business clients, we also offer invoicing with payment terms."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("ctaTitle") || "Ready to fix your device?"}</h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              {t("ctaDescription") ||
                "Contact us today for a free consultation and get your device back to perfect working condition."}
            </p>
            <Button asChild size="lg" className="rounded-full bg-white text-gray-900 hover:bg-gray-100">
              <Link href={`/${params.locale}/contact`}>{t("contactUs") || "Contact Us"}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
