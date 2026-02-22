import { createClient } from "@/lib/supabase"
import { getTranslations } from "next-intl/server"
import { ArticleCard } from "./article-card"

export async function RelatedArticlesList({ locale }: { locale: string }) {
    const supabase = createClient()
    const t = await getTranslations({ locale, namespace: "Services" })

    const { data: articles, error } = await supabase
        .from("articles")
        .select(
            `
      id,
      slug,
      title,
      content,
      featured_image,
      reading_time_minutes,
      view_count,
      tags,
      category,
      published_at,
      article_translations(
        locale,
        title,
        content
      )
    `
        )
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(3)

    if (error || !articles || articles.length === 0) {
        return null
    }

    // Map translations
    const localizedArticles = articles.map((article) => {
        const translation = (article.article_translations as any[])?.find(
            (t) => t.locale === locale
        )
        return {
            ...article,
            displayTitle: translation?.title || article.title,
            displayContent: translation?.content || article.content,
        }
    })

    return (
        <section className="mt-16 bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 mb-8">
            <div className="text-center mb-6 lg:mb-8">
                <h2 className="text-xl lg:text-3xl font-bold text-gray-900 mb-3">
                    {t("relatedArticles")}
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-sm lg:text-base">
                    {t("relatedArticlesDescription")}
                </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localizedArticles.map((article) => (
                    <ArticleCard
                        key={article.id}
                        id={article.id}
                        slug={article.slug}
                        title={article.displayTitle}
                        featured_image={article.featured_image}
                        reading_time_minutes={article.reading_time_minutes}
                        view_count={article.view_count}
                        content={article.displayContent}
                        locale={locale}
                        tags={article.tags}
                        published_at={article.published_at}
                        category={article.category}
                    />
                ))}
            </div>
        </section>
    )
}
