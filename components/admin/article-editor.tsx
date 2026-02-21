"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { generateSlug, generateReadingTime, generateMetaDescription } from "@/lib/articles"
import { Save, Plus, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"

type ArticleTranslation = {
  id: string
  locale: string
  title: string
  content: string
  meta_description: string
}

type ArticleData = {
  id?: string
  slug: string
  title: string
  content: string
  featured_image: string
  featured: boolean
  published: boolean
  meta_description: string
  reading_time_minutes: number
  translations: ArticleTranslation[]
}

type ArticleEditorProps = {
  articleId?: string
  onClose?: () => void
}

const LOCALES = [
  { code: "cs", name: "Čeština" },
  { code: "uk", name: "Українська" },
  { code: "en", name: "English" },
]

export function ArticleEditor({ articleId, onClose }: ArticleEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(!!articleId)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("cs")
  const [addingTranslation, setAddingTranslation] = useState<string | null>(null)

  const [article, setArticle] = useState<ArticleData>({
    slug: "",
    title: "",
    content: "",
    featured_image: "",
    featured: false,
    published: false,
    meta_description: "",
    reading_time_minutes: 1,
    translations: [],
  })

  useEffect(() => {
    if (articleId) {
      fetchArticle()
    }
  }, [articleId])

  const fetchArticle = async () => {
    if (!articleId) return
    try {
      const response = await fetch(`/api/articles/${articleId}`)
      if (!response.ok) throw new Error("Failed to fetch article")

      const data = await response.json()
      setArticle({
        ...data,
        translations: data.article_translations || [],
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load article",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setArticle({
      ...article,
      title,
      slug: generateSlug(title),
    })
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    const readingTime = generateReadingTime(content)
    const metaDescription = generateMetaDescription(content)

    setArticle({
      ...article,
      content,
      reading_time_minutes: readingTime,
      meta_description: metaDescription,
    })
  }

  const handleAddTranslation = async (locale: string) => {
    if (!article.id) {
      toast({
        title: "Error",
        description: "Save the article first before adding translations",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/articles/${article.id}/translations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          title: article.title,
          content: article.content,
        }),
      })

      if (!response.ok) throw new Error("Failed to add translation")

      const translation = await response.json()
      setArticle({
        ...article,
        translations: [...article.translations, translation],
      })
      setAddingTranslation(null)
      setActiveTab(locale)
      toast({
        title: "Success",
        description: `Translation added for ${locale}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add translation",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTranslation = async (locale: string, updates: any) => {
    if (!article.id) return

    try {
      const response = await fetch(
        `/api/articles/${article.id}/translations/${locale}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) throw new Error("Failed to update translation")

      const updated = await response.json()
      setArticle({
        ...article,
        translations: article.translations.map((t) =>
          t.locale === locale ? updated : t
        ),
      })
      toast({
        title: "Success",
        description: "Translation updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update translation",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTranslation = async (locale: string) => {
    if (!article.id) return

    try {
      const response = await fetch(
        `/api/articles/${article.id}/translations/${locale}`,
        { method: "DELETE" }
      )

      if (!response.ok) throw new Error("Failed to delete translation")

      setArticle({
        ...article,
        translations: article.translations.filter((t) => t.locale !== locale),
      })
      toast({
        title: "Success",
        description: "Translation deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete translation",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!article.title || !article.content || !article.slug) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      if (article.id) {
        // Update
        const response = await fetch(`/api/articles/${article.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: article.title,
            content: article.content,
            featured_image: article.featured_image,
            featured: article.featured,
            published: article.published,
          }),
        })

        if (!response.ok) throw new Error("Failed to save article")

        toast({
          title: "Success",
          description: "Article updated successfully",
        })
      } else {
        // Create
        const response = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: article.slug,
            title: article.title,
            content: article.content,
            featured_image: article.featured_image,
            featured: article.featured,
            published: article.published,
          }),
        })

        if (!response.ok) throw new Error("Failed to create article")

        const created = await response.json()
        setArticle({ ...article, id: created.id })

        toast({
          title: "Success",
          description: "Article created successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save article",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const hasTranslation = (locale: string) =>
    article.translations.some((t) => t.locale === locale)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{article.id ? "Edit Article" : "Create New Article"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="main" className="space-y-4">
          <TabsList>
            <TabsTrigger value="main">Main</TabsTrigger>
            {LOCALES.map((locale) => (
              <TabsTrigger
                key={locale.code}
                value={locale.code}
                className={!hasTranslation(locale.code) ? "opacity-50" : ""}
              >
                {locale.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="main" className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={article.title}
                onChange={handleTitleChange}
                placeholder="Article title"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={article.slug}
                onChange={(e) => setArticle({ ...article, slug: e.target.value })}
                placeholder="auto-generated"
              />
            </div>

            <div>
              <Label htmlFor="content">Content (HTML)</Label>
              <Textarea
                id="content"
                value={article.content}
                onChange={handleContentChange}
                placeholder="Article content in HTML"
                className="min-h-80"
              />
              <p className="text-sm text-gray-500 mt-2">
                Reading time: {article.reading_time_minutes} min
              </p>
            </div>

            <div>
              <Label htmlFor="featured_image">Featured Image URL</Label>
              <Input
                id="featured_image"
                value={article.featured_image}
                onChange={(e) =>
                  setArticle({ ...article, featured_image: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={article.meta_description}
                readOnly
                className="min-h-24 bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-2">Auto-generated from content</p>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="featured"
                  checked={article.featured}
                  onCheckedChange={(checked) =>
                    setArticle({ ...article, featured: checked === true })
                  }
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="published"
                  checked={article.published}
                  onCheckedChange={(checked) =>
                    setArticle({ ...article, published: checked === true })
                  }
                />
                <Label htmlFor="published" className="cursor-pointer">
                  Published
                </Label>
              </div>
            </div>
          </TabsContent>

          {LOCALES.map((locale) => {
            const translation = article.translations.find(
              (t) => t.locale === locale.code
            )

            return (
              <TabsContent key={locale.code} value={locale.code} className="space-y-4">
                {!translation && !addingTranslation?.includes(locale.code) ? (
                  <Button
                    onClick={() => handleAddTranslation(locale.code)}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add {locale.name} Translation
                  </Button>
                ) : translation ? (
                  <>
                    <div>
                      <Label>Title ({locale.name})</Label>
                      <Input
                        value={translation.title}
                        onChange={(e) =>
                          handleUpdateTranslation(locale.code, {
                            title: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label>Content ({locale.name})</Label>
                      <Textarea
                        value={translation.content}
                        onChange={(e) =>
                          handleUpdateTranslation(locale.code, {
                            content: e.target.value,
                          })
                        }
                        className="min-h-80"
                      />
                    </div>

                    <div>
                      <Label>Meta Description ({locale.name})</Label>
                      <Textarea
                        value={translation.meta_description}
                        readOnly
                        className="min-h-24 bg-gray-50"
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full text-red-600 gap-2"
                      onClick={() => handleDeleteTranslation(locale.code)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Translation
                    </Button>
                  </>
                ) : null}
              </TabsContent>
            )
          })}
        </Tabs>

        <div className="flex gap-2 justify-end">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Article"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
