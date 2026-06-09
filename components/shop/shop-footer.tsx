"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { useTranslations } from "next-intl"

import { b2bSiteUrl, mainSiteUrl } from "@/lib/site-config"

export function ShopFooter({ locale }: { locale: string }) {
  const t = useTranslations("Shop.footer")

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="container grid gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-950">DeviceHelp Shop</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">{t("tagline")}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-950">{t("shopping")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <Link href={`/${locale}/category/protection`} className="hover:text-gray-950">
                {t("protection")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/category/charging`} className="hover:text-gray-950">
                {t("charging")}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/category/parts`} className="hover:text-gray-950">
                {t("parts")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-950">{t("support")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <a href={`${mainSiteUrl}/${locale}/terms`} className="hover:text-gray-950">
                {t("terms")}
              </a>
            </li>
            <li>
              <a href={`${mainSiteUrl}/${locale}/privacy`} className="hover:text-gray-950">
                {t("privacy")}
              </a>
            </li>
            <li>
              <a href={`${mainSiteUrl}/${locale}/contact`} className="hover:text-gray-950">
                {t("contact")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-950">{t("devicehelp")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <a href={`${mainSiteUrl}/${locale}`} className="hover:text-gray-950">
                {t("repairSite")}
              </a>
            </li>
            <li>
              <a href={`${b2bSiteUrl}/${locale}`} className="hover:text-gray-950">
                {t("b2b")}
              </a>
            </li>
            <li>
              <a
                href={`${mainSiteUrl}/${locale}/privacy`}
                className="inline-flex items-center gap-1 hover:text-gray-950"
              >
                <Settings className="h-3 w-3" />
                {t("cookieSettings")}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
