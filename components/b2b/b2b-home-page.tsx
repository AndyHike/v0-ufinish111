import Link from "next/link"
import { getTranslations } from "next-intl/server"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { mainSiteUrl } from "@/lib/site-config"

interface B2BHomePageProps {
  locale: string
}

export async function B2BHomePage({ locale }: B2BHomePageProps) {
  const t = await getTranslations({ locale, namespace: "B2B.home" })
  const audiences = t.raw("audiences") as string[]
  const benefits = t.raw("benefits") as string[]
  const process = t.raw("process") as string[]
  const registerHref = `${mainSiteUrl}/${locale}/auth/register?b2b=1`

  return (
    <div className="bg-white">
      <section className="border-b bg-slate-50">
        <div className="container grid gap-10 px-4 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-20">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Building2 className="h-4 w-4" />
              {t("eyebrow")}
            </div>
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 md:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href={registerHref}>
                  {t("primaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#contact">{t("secondaryCta")}</a>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-gray-700 sm:grid-cols-3">
              {[t("trust1"), t("trust2"), t("trust3")].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid content-center gap-3">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <Wrench className="mb-4 h-8 w-8 text-primary" />
              <h2 className="text-lg font-semibold text-gray-950">{t("audienceTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{t("audienceSubtitle")}</p>
              <div className="mt-5 grid gap-2">
                {audiences.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
            {t("benefitsTitle")}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="rounded-lg border bg-white p-5">
                <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-gray-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y bg-gray-50 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
            {t("processTitle")}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {process.map((step, index) => (
              <div key={step} className="rounded-lg bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-12 md:py-16">
        <div className="container grid gap-8 px-4 md:grid-cols-[1fr_auto] md:px-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-3xl">
              {t("contactTitle")}
            </h2>
            <p className="mt-3 max-w-2xl text-gray-600">{t("contactText")}</p>
          </div>
          <div className="grid gap-3 text-sm">
            <a className="flex items-center gap-2 font-medium hover:text-primary" href="tel:+420775848259">
              <Phone className="h-4 w-4 text-primary" />
              +420 775 848 259
            </a>
            <a className="flex items-center gap-2 font-medium hover:text-primary" href="mailto:info@devicehelp.cz">
              <Mail className="h-4 w-4 text-primary" />
              info@devicehelp.cz
            </a>
          </div>
        </div>
      </section>

      <section className="border-t bg-slate-950 py-12 text-white md:py-16">
        <div className="container flex flex-col items-start justify-between gap-6 px-4 md:flex-row md:items-center md:px-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("finalTitle")}</h2>
            <p className="mt-3 max-w-2xl text-slate-300">{t("finalText")}</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link href={registerHref}>
              {t("primaryCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
