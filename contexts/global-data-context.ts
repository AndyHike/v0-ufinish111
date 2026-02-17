"use client"

import { createContext } from "react"

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url?: string
  description?: string
  position?: number
}

export interface Series {
  id: string
  name: string
  slug: string
  brand_id: string
  image_url?: string
  description?: string
  position?: number
  brands?: Brand
}

export interface Model {
  id: string
  name: string
  slug: string
  brand_id: string
  series_id?: string | null
  image_url?: string
  position?: number
  brands?: Brand
  series?: Series
}

export interface GlobalDataContextType {
  brands: Map<string, Brand>
  series: Map<string, Series>
  models: Map<string, Model>
  setCachedBrand: (slug: string, brand: Brand) => void
  setCachedSeries: (slug: string, series: Series) => void
  setCachedModel: (slug: string, model: Model) => void
  getCachedBrand: (slug: string) => Brand | undefined
  getCachedSeries: (slug: string) => Series | undefined
  getCachedModel: (slug: string) => Model | undefined
}

export const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined)
