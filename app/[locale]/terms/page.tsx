import { getAppSetting } from "@/lib/app-settings"
import { getTranslations } from "next-intl/server"
import ReactMarkdown from "react-markdown"

export default async function TermsPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const t = await getTranslations("terms")

  // Get terms of service content from database
  const termsContent =
    (await getAppSetting(`terms_of_service_${locale}`)) ||
    (await getAppSetting("terms_of_service_uk")) || // fallback to Ukrainian
    t("defaultContent")

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">{t("title")}</h1>

        <div className="prose prose-lg max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-gray-900">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700">{children}</h3>,
              p: ({ children }) => <p className="mb-4 text-gray-600 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-600">{children}</ul>,
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-600">{children}</ol>
              ),
              li: ({ children }) => <li className="ml-4">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
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
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>
              ),
              hr: () => <hr className="my-8 border-gray-300" />,
            }}
          >
            {termsContent}
          </ReactMarkdown>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {t("lastUpdated")}: {new Date().toLocaleDateString(locale)}
          </p>
        </div>
      </div>
    </div>
  )
}
