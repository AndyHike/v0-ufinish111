import type React from "react"

import { SiteLocaleLayout } from "@/components/site-locale-layout"
import "@/app/globals.css"

export default async function B2BLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <SiteLocaleLayout locale={locale} variant="b2b">
      {children}
    </SiteLocaleLayout>
  )
}
