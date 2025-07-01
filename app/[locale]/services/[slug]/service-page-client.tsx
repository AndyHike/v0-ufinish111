"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Shield } from "lucide-react"

import type { Service } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

interface ServicePageClientProps {
  service: Service | null
}

const ServicePageClient: React.FC<ServicePageClientProps> = ({ service }) => {
  const t = useTranslations("ServicePage")
  const params = useParams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  if (!service) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{service.name}</h1>
        <p className="text-sm text-muted-foreground">
          {t("serviceSlug")}: {params.slug}
        </p>
      </div>

      {service.key_benefits && (
        <div>
          <h2 className="text-lg font-semibold">{t("keyBenefits")}</h2>
          <ul className="list-disc pl-5 space-y-2">
            {service.key_benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Shield className="h-3 w-3 text-green-600" />
        <span>
          {t("warranty")} {t("warrantyMonths", { count: service.warranty_months || 3 })}
        </span>
      </div>
    </div>
  )
}

export default ServicePageClient
