import { ArticleEditor } from "@/components/admin/article-editor"
import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useLocale } from "next-intl"

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  return {
    title: "Create Article",
  }
}

export default function CreateArticlePage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/articles">
        <Button variant="ghost" className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Articles
        </Button>
      </Link>

      <div>
        <h1 className="text-4xl font-bold tracking-tight">Create New Article</h1>
        <p className="text-muted-foreground mt-2">Add a new repair guide or tip</p>
      </div>

      <ArticleEditor />
    </div>
  )
}
