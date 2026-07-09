import { createClient } from "@/lib/supabase"
import { getTranslations } from "next-intl/server"
import { ArticleCard } from "./article-card"

const ARTICLE_COLUMNS = `
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

const LIST_SIZE = 3

/**
 * Related articles block. When `serviceId` is given (service×model pages),
 * articles explicitly linked to that service (article_service_links) come
 * first, so the block is a topical signal instead of a "3 newest" artifact;
 * remaining slots are filled with the newest published articles.
 */
export async function RelatedArticlesList({ locale, serviceId }: { locale: string; serviceId?: string }) {
    const supabase = createClient()
    const t = await getTranslations({ locale, namespace: "Services" })

    let articles: any[] = []

    if (serviceId) {
        const { data: links } = await supabase
            .from("article_service_links")
            .select("article_id, position")
            .eq("service_id", serviceId)
            .order("position")

        const linkedIds = (links || []).map((l: any) => l.article_id)
        if (linkedIds.length > 0) {
            const { data: linked } = await supabase
                .from("articles")
                .select(ARTICLE_COLUMNS)
                .eq("published", true)
                .in("id", linkedIds)

            if (linked) {
                // Preserve the admin-curated link order.
                const order = new Map(linkedIds.map((id: string, i: number) => [id, i]))
                articles = [...linked].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999))
            }
        }
    }

    if (articles.length < LIST_SIZE) {
        const { data: latest, error } = await supabase
            .from("articles")
            .select(ARTICLE_COLUMNS)
            .eq("published", true)
            .order("published_at", { ascending: false })
            .limit(LIST_SIZE)

        if (error && articles.length === 0) {
            return null
        }
        const seen = new Set(articles.map((a) => a.id))
        for (const article of latest || []) {
            if (articles.length >= LIST_SIZE) break
            if (!seen.has(article.id)) articles.push(article)
        }
    }

    articles = articles.slice(0, LIST_SIZE)
    if (articles.length === 0) {
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
