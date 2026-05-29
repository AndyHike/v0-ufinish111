import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import {
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  History,
  Mail,
  Package,
  Percent,
  Phone,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { mainSiteUrl } from "@/lib/site-config"

interface B2BHomePageProps {
  locale: string
}

interface B2BListItem {
  title: string
  text: string
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

function getItemArray(value: unknown): B2BListItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is B2BListItem => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof (item as B2BListItem).title === "string" &&
      typeof (item as B2BListItem).text === "string"
    )
  })
}

const cooperationIcons = [Truck, Package, Percent, Clock3, ShieldCheck, Wrench]
const accountIcons = [Clock3, History, FileText, Building2, Percent]

export async function B2BHomePage({ locale }: B2BHomePageProps) {
  const t = await getTranslations({ locale, namespace: "B2B.home" })
  const proofRows = getStringArray(t.raw("proofRows"))
  const cooperationBenefits = getItemArray(t.raw("cooperationBenefits"))
  const accountFeatures = getItemArray(t.raw("accountFeatures"))
  const processSteps = getItemArray(t.raw("processSteps"))
  const registerHref = `${mainSiteUrl}/${locale}/auth/register?b2b=1`

  return (
    <div className="bg-white text-gray-950">
      <section className="border-b border-gray-100 bg-white">
        <div className="container grid gap-10 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)] lg:items-center lg:py-20">
          <div className="flex flex-col justify-center">
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-4xl md:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="w-full shadow-sm sm:w-auto">
                <Link href={registerHref}>
                  {t("primaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="w-full justify-center px-0 text-primary hover:bg-transparent sm:w-auto sm:justify-start"
              >
                <a href="#contact">
                  {t("secondaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="mt-8 divide-y divide-gray-200 border-y border-gray-200 text-sm text-gray-800">
              {proofRows.map((item) => (
                <div key={item} className="flex items-center gap-3 py-3">
                  <Check className="h-4 w-4 text-gray-950" strokeWidth={1.8} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
            <Image
              src="/focused-phone-fix.webp"
              alt={t("title")}
              width={900}
              height={675}
              priority
              className="aspect-[4/3] w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-gray-200 bg-white/95 p-4 shadow-sm sm:right-auto sm:max-w-[260px]">
              <p className="text-sm font-semibold text-gray-950">{t("eyebrow")}</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">{proofRows[2]}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="bg-gray-50 py-14 md:py-20">
        <div className="container grid gap-10 px-4 md:px-6 lg:grid-cols-[0.45fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950 md:text-4xl">
              {t("cooperationTitle")}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-gray-600 md:text-base">
              {t("cooperationText")}
            </p>
          </div>

          <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
            {cooperationBenefits.map((benefit, index) => {
              const Icon = cooperationIcons[index] ?? Check

              return (
                <div
                  key={benefit.title}
                  className="grid gap-3 p-5 sm:grid-cols-[48px_0.75fr_1fr] sm:items-start md:p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-800">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <h3 className="text-sm font-semibold leading-6 text-gray-950">{benefit.title}</h3>
                  <p className="text-sm leading-6 text-gray-600">{benefit.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="account" className="bg-white py-14 md:py-20">
        <div className="container grid gap-10 px-4 md:px-6 lg:grid-cols-[0.48fr_1fr] lg:gap-16">
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950 md:text-4xl">
              {t("accountTitle")}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-gray-600 md:text-base">
              {t("accountText")}
            </p>
            <Link
              href={registerHref}
              className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {t("primaryCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {accountFeatures.map((feature, index) => {
              const Icon = accountIcons[index] ?? Check

              return (
                <div
                  key={feature.title}
                  className="grid gap-3 border-b border-gray-200 p-5 last:border-b-0 sm:grid-cols-[40px_0.8fr_1fr_24px] sm:items-center md:p-6"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-800">
                    <Icon className="h-4 w-4" strokeWidth={1.7} />
                  </div>
                  <h3 className="text-sm font-semibold leading-6 text-gray-950">{feature.title}</h3>
                  <p className="text-sm leading-6 text-gray-600">{feature.text}</p>
                  <ChevronRight className="hidden h-4 w-4 text-gray-400 sm:block" />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-gray-100 bg-gray-50 py-14 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950 md:text-4xl">
              {t("processTitle")}
            </h2>
            <p className="mt-5 text-sm leading-7 text-gray-600 md:text-base">{t("processText")}</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-4 md:gap-0">
            {processSteps.map((step, index) => (
              <div key={step.title} className="relative md:pr-6">
                {index < processSteps.length - 1 && (
                  <div className="absolute left-8 top-4 hidden h-px w-[calc(100%-2rem)] bg-gray-300 md:block" />
                )}
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-950">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-sm font-semibold leading-6 text-gray-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white py-14 md:py-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 rounded-xl border border-gray-200 bg-gray-50 p-6 md:grid-cols-[1fr_0.9fr] md:p-8 lg:p-10">
            <div>
              <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl">
                {t("contactTitle")}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                {t("contactText")}
              </p>
              <Button asChild size="lg" className="mt-7 w-full shadow-sm sm:w-auto">
                <Link href={registerHref}>
                  {t("primaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <h3 className="text-base font-semibold text-gray-950">{t("contactHelpTitle")}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{t("contactHelpText")}</p>
              <div className="mt-6 grid gap-4 text-sm">
                <a className="group flex gap-3 text-gray-700 hover:text-primary" href="mailto:info@devicehelp.cz">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 group-hover:text-primary" />
                  <span>
                    <span className="block font-medium text-gray-950 group-hover:text-primary">info@devicehelp.cz</span>
                    <span className="mt-1 block text-gray-500">{t("emailLabel")}</span>
                  </span>
                </a>
                <a className="group flex gap-3 text-gray-700 hover:text-primary" href="tel:+420775848259">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 group-hover:text-primary" />
                  <span>
                    <span className="block font-medium text-gray-950 group-hover:text-primary">+420 775 848 259</span>
                    <span className="mt-1 block text-gray-500">{t("phoneLabel")}</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
