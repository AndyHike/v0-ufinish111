import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { mainSiteUrl } from "@/lib/site-config"

interface B2BFAQPageProps {
  locale: string
}

interface FAQItem {
  question: string
  answer: string
}

function getFAQItems(value: unknown): FAQItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (item): item is FAQItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as FAQItem).question === "string" &&
      typeof (item as FAQItem).answer === "string",
  )
}

export async function B2BFAQPage({ locale }: B2BFAQPageProps) {
  const t = await getTranslations({ locale, namespace: "B2B.faq" })
  const home = await getTranslations({ locale, namespace: "B2B.home" })
  const items = getFAQItems(t.raw("items"))

  return (
    <div className="bg-white">
      <section className="border-b bg-slate-50 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container grid gap-4 px-4 md:px-6">
          {items.map((item) => (
            <article key={item.question} className="rounded-lg border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-950">{item.question}</h2>
              <p className="mt-2 leading-7 text-gray-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t bg-slate-950 py-12 text-white md:py-16">
        <div className="container flex flex-col gap-5 px-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{home("finalTitle")}</h2>
            <p className="mt-2 max-w-2xl text-slate-300">{home("finalText")}</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link href={`${mainSiteUrl}/${locale}/auth/register?b2b=1`}>
              {home("primaryCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
