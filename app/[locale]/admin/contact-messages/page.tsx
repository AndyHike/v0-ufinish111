import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { ContactMessagesList } from "@/components/admin/contact-messages-list"
import { Skeleton } from "@/components/ui/skeleton"

interface ContactMessagesPageProps {
  params: {
    locale: string
  }
}

export default function ContactMessagesPage({ params: { locale } }: ContactMessagesPageProps) {
  const translations: Record<string, Record<string, string>> = {
    uk: {
      title: "Повідомлення з контактної форми",
      description: "Перегляд та управління повідомленнями, отриманими через контактну форму",
    },
    cs: {
      title: "Zprávy z kontaktního formuláře",
      description: "Prohlížení a správa zpráv přijatých prostřednictvím kontaktního formuláře",
    },
    en: {
      title: "Contact Form Messages",
      description: "View and manage messages received through the contact form",
    },
  }

  const t = translations[locale] || translations.en

  return (
    <div className="space-y-6">
      <PageHeader heading={t.title} text={t.description} />

      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <ContactMessagesList locale={locale} />
      </Suspense>
    </div>
  )
}
