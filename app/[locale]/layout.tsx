import type React from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { InfoBanner } from "@/components/info-banner"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSiteSettingsServer } from "@/lib/site-settings-server"

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages()
  const session = await getServerSession(authOptions)
  const initialSettings = await getSiteSettingsServer()

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex flex-col">
        <InfoBanner />
        <Header user={session?.user} initialSettings={initialSettings} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  )
}
