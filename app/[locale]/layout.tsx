import type React from "react"
import { NextIntlClientProvider } from "next-intl"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth/session"
import { getMessages } from "@/lib/get-messages"

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  let messages
  try {
    messages = await getMessages(locale)
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    notFound()
  }

  const user = await getCurrentUser()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-screen flex-col">
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  )
}
