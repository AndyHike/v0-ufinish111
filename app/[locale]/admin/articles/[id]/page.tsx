import { ArticleEditor } from "@/components/admin/article-editor"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  return {
    title: "Edit Article",
  }
}

export default function EditArticlePage({
  params: { id },
}: {
  params: { id: string }
}) {
  return (
    <div className="space-y-6">
      <Link href="/admin/articles">
        <Button variant="ghost" className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Articles
        </Button>
      </Link>

      <div>
        <h1 className="text-4xl font-bold tracking-tight">Edit Article</h1>
        <p className="text-muted-foreground mt-2">Update article content and translations</p>
      </div>

      <ArticleEditor articleId={id} />
    </div>
  )
}
