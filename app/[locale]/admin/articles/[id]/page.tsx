import { ArticleEditor } from "@/components/admin/article-editor"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: "Edit Article",
  }
}

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params
  return (
    <div className="space-y-6">
      <Link href={`/${locale}/admin/articles`}>
        <Button variant="ghost" className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Articles
        </Button>
      </Link>

      <div>
        <h1 className="text-4xl font-bold tracking-tight">Edit Article</h1>
        <p className="text-muted-foreground mt-2">Update article content and translations</p>
      </div>

      <ArticleEditor articleId={id} locale={locale} />
    </div>
  )
}
