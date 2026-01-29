"use client"

import { useContext } from "react"
import { GlobalDataContext } from "@/contexts/global-data-context"

export function useGlobalData() {
  const context = useContext(GlobalDataContext)
  
  if (!context) {
    throw new Error("useGlobalData must be used within GlobalDataProvider")
  }
  
  return context
}
