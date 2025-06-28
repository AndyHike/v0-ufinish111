import { getTranslations } from "next-intl/server"
import { getAppSetting } from "@/lib/app-settings"

export default async function TermsPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale, namespace: "Terms" })
  const termsContent = await getAppSetting("terms_of_service_content")

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
      </div>

      <div className="prose prose-sm sm:prose lg:prose-lg mx-auto">
        {termsContent ? <div className="whitespace-pre-wrap">{termsContent}</div> : <p>{t("contentPlaceholder")}</p>}
      </div>
    </div>
  )
}
