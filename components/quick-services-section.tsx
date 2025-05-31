"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Smartphone, Battery, Wifi, Shield, Brush, Droplet } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuickServicesSection() {
  const t = useTranslations("Services")
  const params = useParams()
  const locale = params.locale as string

  const services = [
    {
      id: "screen-replacement",
      icon: Smartphone,
      translationKey: "screenReplacement",
    },
    {
      id: "battery-replacement",
      icon: Battery,
      translationKey: "batteryReplacement",
    },
    {
      id: "board-repair",
      icon: Wifi,
      translationKey: "boardRepair",
    },
    {
      id: "screen-protection",
      icon: Shield,
      translationKey: "screenProtection",
    },
    {
      id: "phone-cleaning",
      icon: Brush,
      translationKey: "phoneCleaning",
    },
    {
      id: "water-damage-repair",
      icon: Droplet,
      translationKey: "waterDamageRepair",
    },
  ]

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{t("title")}</h2>
          <p className="mt-4 text-muted-foreground md:text-xl">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.slice(0, 6).map((service) => (
            <div
              key={service.id}
              className="flex flex-col p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t(`${service.translationKey}.name`)}</h3>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 flex-grow">{t(`${service.translationKey}.shortDescription`)}</p>
              <div className="flex justify-between items-center mt-auto">
                <Link
                  href={`/${locale}/services#${service.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t("learnMore")}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Button asChild size="lg">
            <Link href={`/${locale}/services`}>{t("allServicesButton")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
