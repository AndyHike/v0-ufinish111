import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { getAppSetting } from "@/lib/app-settings"
import ReactMarkdown from "react-markdown"
import { siteUrl } from "@/lib/site-config"

type Props = {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params

  const titlePatterns = {
    cs: "Zásady ochrany osobních údajů | DeviceHelp",
    en: "Privacy Policy | DeviceHelp",
    uk: "Політика конфіденційності | DeviceHelp",
  }

  const descriptionPatterns = {
    cs: "Přečtěte si naše zásady ochrany osobních údajů, abyste pochopili, jak chráníme vaše osobní údaje.",
    en: "Read our privacy policy to understand how we protect your personal data.",
    uk: "Прочитайте нашу політику конфіденційності, щоб зрозуміти, як ми захищаємо ваші особисті дані.",
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    alternates: {
      canonical: `${siteUrl}/${locale}/privacy`,
      languages: {
        cs: `${siteUrl}/cs/privacy`,
        en: `${siteUrl}/en/privacy`,
        uk: `${siteUrl}/uk/privacy`,
        "x-default": `${siteUrl}/cs/privacy`,
      },
    },
  }
}

export default async function PrivacyPage({
  params,
}: {
  params: { locale: string }
}) {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: "Privacy" })
  const privacyContent = await getAppSetting("privacy_policy_content")

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
      </div>

      <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto max-w-4xl">
        {privacyContent ? (
          <ReactMarkdown
            className="markdown-content"
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-800">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-medium mt-4 mb-2 text-gray-700">{children}</h3>,
              p: ({ children }) => <p className="mb-4 text-gray-600 leading-relaxed">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
              li: ({ children }) => <li className="text-gray-600">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-gray-50 italic text-gray-700">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>
              ),
              pre: ({ children }) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              hr: () => <hr className="my-8 border-gray-300" />,
            }}
          >
            {privacyContent}
          </ReactMarkdown>
        ) : (
          <p className="text-gray-600">{t("contentPlaceholder")}</p>
        )}
      </div>
    </div>
  )
}
