import type React from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "@/lib/get-messages"

export default async function MaintenanceLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages(locale)

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
