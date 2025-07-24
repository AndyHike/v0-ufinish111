"use client"

import { useState, useEffect } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type { Service } from "@/types"
import type { Brand } from "@/types"
import type { Model } from "@/types"
import type { Series } from "@/types"
import Link from "next/link"

interface Props {
  service: Service
  brands: Brand[]
}

const ServicePageClient = ({ service, brands }: Props) => {
  const t = useTranslations("ServicePage")
  const { locale } = useParams()
  const pathname = usePathname()
  const router = useRouter()

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [series, setSeries] = useState<Series[]>([])

  useEffect(() => {
    if (selectedBrand) {
      setModels(selectedBrand.models)
      setSelectedModel(null)
      setSelectedSeries(null)
      setSeries([])
    } else {
      setModels([])
      setSelectedModel(null)
      setSelectedSeries(null)
      setSeries([])
    }
  }, [selectedBrand])

  useEffect(() => {
    if (selectedModel) {
      setSeries(selectedModel.series)
      setSelectedSeries(null)
    } else {
      setSeries([])
      setSelectedSeries(null)
    }
  }, [selectedModel])

  return (
    <div>
      <h2>{service.name}</h2>
      <p>{service.description}</p>

      <div>
        <h3>{t("chooseBrand")}</h3>
        <select
          value={selectedBrand ? selectedBrand.id : ""}
          onChange={(e) => {
            const brandId = e.target.value
            if (brandId) {
              const brand = brands.find((b) => b.id === brandId)
              setSelectedBrand(brand || null)
            } else {
              setSelectedBrand(null)
            }
          }}
        >
          <option value="">{t("selectBrand")}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {selectedBrand && (
        <div>
          <h3>{t("chooseModel")}</h3>
          <select
            value={selectedModel ? selectedModel.id : ""}
            onChange={(e) => {
              const modelId = e.target.value
              if (modelId) {
                const model = models.find((m) => m.id === modelId)
                setSelectedModel(model || null)
              } else {
                setSelectedModel(null)
              }
            }}
          >
            <option value="">{t("selectModel")}</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedModel && (
        <div>
          <h3>{t("chooseSeries")}</h3>
          <select
            value={selectedSeries ? selectedSeries.id : ""}
            onChange={(e) => {
              const seriesId = e.target.value
              if (seriesId) {
                const seriesItem = series.find((s) => s.id === seriesId)
                setSelectedSeries(seriesItem || null)
              } else {
                setSelectedSeries(null)
              }
            }}
          >
            <option value="">{t("selectSeries")}</option>
            {series.map((seriesItem) => (
              <option key={seriesItem.id} value={seriesItem.id}>
                {seriesItem.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Link
        href={`/${locale}/book-service?service=${encodeURIComponent(service.name)}&brand=${encodeURIComponent(selectedBrand?.name || "")}&model=${encodeURIComponent(selectedModel?.name || "")}${selectedSeries ? `&series=${encodeURIComponent(selectedSeries.name)}` : ""}`}
      >
        {t("orderService")}
      </Link>
    </div>
  )
}

export default ServicePageClient
