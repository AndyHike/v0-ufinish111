"use client"

import React, { useState, useCallback } from "react"
import { GlobalDataContext, type GlobalDataContextType, type Brand, type Series, type Model } from "@/contexts/global-data-context"

interface GlobalDataProviderProps {
  children: React.ReactNode
}

export function GlobalDataProvider({ children }: GlobalDataProviderProps) {
  const [brands] = useState<Map<string, Brand>>(new Map())
  const [series] = useState<Map<string, Series>>(new Map())
  const [models] = useState<Map<string, Model>>(new Map())

  const setCachedBrand = useCallback((slug: string, brand: Brand) => {
    brands.set(slug, brand)
  }, [brands])

  const setCachedSeries = useCallback((slug: string, series_data: Series) => {
    series.set(slug, series_data)
  }, [series])

  const setCachedModel = useCallback((slug: string, model: Model) => {
    models.set(slug, model)
  }, [models])

  const getCachedBrand = useCallback((slug: string) => {
    return brands.get(slug)
  }, [brands])

  const getCachedSeries = useCallback((slug: string) => {
    return series.get(slug)
  }, [series])

  const getCachedModel = useCallback((slug: string) => {
    return models.get(slug)
  }, [models])

  const value: GlobalDataContextType = {
    brands,
    series,
    models,
    setCachedBrand,
    setCachedSeries,
    setCachedModel,
    getCachedBrand,
    getCachedSeries,
    getCachedModel,
  }

  return <GlobalDataContext.Provider value={value}>{children}</GlobalDataContext.Provider>
}
