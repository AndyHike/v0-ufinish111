import { getTranslations } from "next-intl/server"
import { getAppSetting } from "@/lib/app-settings"

export default async function PrivacyPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations({ locale, namespace: "Privacy" })
  const privacyContent = await getAppSetting("privacy_policy_content")

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
      </div>

      <div className="prose prose-sm sm:prose lg:prose-lg mx-auto">
        {privacyContent ? (
          <div className="whitespace-pre-wrap">{privacyContent}</div>
        ) : (
          <p>{t("contentPlaceholder")}</p>
        )}
      </div>
    </div>
  )
}
