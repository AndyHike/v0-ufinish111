'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { generateSlug, generateReadingTime, generateMetaDescription } from '@/lib/articles'
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

const LOCALES = [
  { code: 'cs', name: 'Čeština' },
  { code: 'uk', name: 'Українська' },
  { code: 'en', name: 'English' },
]

interface ArticleTranslation {
  id?: string
  locale: string
  title: string
  content: string
}

interface ArticleData {
  id?: string
  slug: string
  title: string
  tags: string[]
  content: string
  featured_image: string
  featured: boolean
  published: boolean
  meta_description: string
  reading_time_minutes: number
  translations: ArticleTranslation[]
}

interface ArticleEditorProps {
  articleId?: string
  locale: string
}

export function ArticleEditor({ articleId, locale }: ArticleEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(!!articleId)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(locale)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [article, setArticle] = useState<ArticleData>({
    slug: '',
    title: '',
    tags: [],
    content: '',
    featured_image: '',
    featured: false,
    published: false,
    meta_description: '',
    reading_time_minutes: 1,
    translations: [],
  })

  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (articleId) {
      fetchArticle()
    }
  }, [articleId])

  const fetchArticle = async () => {
    if (!articleId) return
    try {
      const response = await fetch(`/api/articles/${articleId}`)
      if (!response.ok) throw new Error('Failed to fetch article')

      const data = await response.json()
      setArticle({
        ...data,
        tags: data.tags || [],
        translations: data.article_translations || [],
      })
      setTagInput((data.tags || []).join(', '))
    } catch (error) {
      setError('Failed to load article')
      toast({
        title: 'Error',
        description: 'Failed to load article',
        variant: 'destructive',
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

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTagInput(value)
    setArticle({
      ...article,
      tags: value.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  const handleSave = async () => {
    if (!article.title || !article.content || !article.slug) {
      setError('Please fill in all required fields')
      return
    }

    setError(null)
    setSuccess(false)
    setIsSaving(true)

    try {
      const payload = {
        slug: article.slug,
        title: article.title,
        content: article.content,
        featured_image: article.featured_image,
        featured: article.featured,
        published: article.published,
        tags: article.tags,
        meta_description: article.meta_description,
        reading_time_minutes: article.reading_time_minutes,
      }

      const response = await fetch(
        articleId ? `/api/articles/${articleId}` : '/api/articles',
        {
          method: articleId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save article')
      }

      setSuccess(true)
      toast({
        title: 'Success',
        description: articleId ? 'Article updated successfully' : 'Article created successfully',
      })

      setTimeout(() => {
        router.push(`/${locale}/admin/articles`)
      }, 2000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save article'
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const currentLocale = LOCALES.find(l => l.code === activeTab)
  const translation = article.translations.find(t => t.locale === activeTab)

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">Article saved successfully!</p>
        </div>
      )}

      <Tabs defaultValue="main" className="space-y-4">
        <TabsList>
          <TabsTrigger value="main">Main</TabsTrigger>
          {LOCALES.map(loc => (
            <TabsTrigger key={loc.code} value={loc.code}>
              {loc.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Main Tab */}
        <TabsContent value="main" className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={article.title}
              onChange={handleTitleChange}
              placeholder="Article title"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug (auto-generated)</Label>
            <Input
              id="slug"
              value={article.slug}
              readOnly
              placeholder="Auto-generated from title"
              className="mt-1 bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={handleTagsChange}
              placeholder="repair, phone, screen"
              className="mt-1"
            />
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {article.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="featured_image">Featured Image URL</Label>
            <Input
              id="featured_image"
              value={article.featured_image}
              onChange={(e) => setArticle({ ...article, featured_image: e.target.value })}
              placeholder="https://..."
              className="mt-1"
            />
            {article.featured_image && (
              <img src={article.featured_image} alt="Preview" className="mt-2 h-32 object-cover rounded" />
            )}
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={article.featured}
                onChange={(e) => setArticle({ ...article, featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span>Featured Article</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={article.published}
                onChange={(e) => setArticle({ ...article, published: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span>Published</span>
            </label>
          </div>

          <div>
            <Label htmlFor="content">Content (Main Language) *</Label>
            <Textarea
              id="content"
              value={article.content}
              onChange={handleContentChange}
              placeholder="Article content (supports HTML)"
              className="mt-1 min-h-96 font-mono text-sm"
            />
            <div className="text-sm text-gray-500 mt-2">
              Reading time: {article.reading_time_minutes} min | Words: {article.content.split(/\s+/).length}
            </div>
          </div>

          <div>
            <Label htmlFor="meta_description">Meta Description (auto-generated)</Label>
            <Textarea
              id="meta_description"
              value={article.meta_description}
              readOnly
              className="mt-1 min-h-24 bg-gray-50"
            />
          </div>
        </TabsContent>

        {/* Translation Tabs */}
        {LOCALES.map(locale => {
          const trans = article.translations.find(t => t.locale === locale.code)
          return (
            <TabsContent key={locale.code} value={locale.code} className="space-y-4">
              <div>
                <Label htmlFor={`title-${locale.code}`}>Title ({locale.name})</Label>
                <Input
                  id={`title-${locale.code}`}
                  value={trans?.title || ''}
                  onChange={(e) => {
                    const updated = trans
                      ? { ...trans, title: e.target.value }
                      : { locale: locale.code, title: e.target.value, content: '' }
                    setArticle({
                      ...article,
                      translations: article.translations.some(t => t.locale === locale.code)
                        ? article.translations.map(t => (t.locale === locale.code ? updated : t))
                        : [...article.translations, updated],
                    })
                  }}
                  placeholder={`Title in ${locale.name}`}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`content-${locale.code}`}>Content ({locale.name})</Label>
                <Textarea
                  id={`content-${locale.code}`}
                  value={trans?.content || ''}
                  onChange={(e) => {
                    const updated = trans
                      ? { ...trans, content: e.target.value }
                      : { locale: locale.code, title: article.title, content: e.target.value }
                    setArticle({
                      ...article,
                      translations: article.translations.some(t => t.locale === locale.code)
                        ? article.translations.map(t => (t.locale === locale.code ? updated : t))
                        : [...article.translations, updated],
                    })
                  }}
                  placeholder={`Content in ${locale.name}`}
                  className="mt-1 min-h-96 font-mono text-sm"
                />
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Actions */}
      <div className="flex gap-4 justify-end pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {articleId ? 'Update' : 'Create'} Article
        </Button>
      </div>
    </div>
  )
}
