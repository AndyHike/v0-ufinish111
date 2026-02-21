'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { generateSlug, generateReadingTime, generateMetaDescription } from '@/lib/articles'
import { Save, X, Upload, Bold, Italic, AlignCenter, List } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import Quill editor to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

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
  meta_description?: string
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
  locale?: string
  onClose?: () => void
}

export function ArticleEditor({ articleId, locale = 'cs', onClose }: ArticleEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations('Admin')
  
  const [isLoading, setIsLoading] = useState(!!articleId)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(locale)
  const [editorReady, setEditorReady] = useState(false)

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
    translations: LOCALES.map(l => ({
      locale: l.code,
      title: '',
      content: '',
    })),
  })

  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    if (articleId) {
      fetchArticle()
    }
    setEditorReady(true)
  }, [articleId])

  const fetchArticle = async () => {
    if (!articleId) return
    try {
      const response = await fetch(`/api/articles/${articleId}`)
      if (!response.ok) throw new Error('Failed to fetch article')

      const data = await response.json()
      setArticle({
        ...data,
        translations: data.article_translations || [],
      })
      setTagsInput((data.tags || []).join(', '))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load article',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTitleChange = (value: string) => {
    setArticle({
      ...article,
      title: value,
      slug: generateSlug(value),
    })
  }

  const handleContentChange = (value: string) => {
    const readingTime = generateReadingTime(value)
    const metaDescription = generateMetaDescription(value)

    setArticle({
      ...article,
      content: value,
      reading_time_minutes: readingTime,
      meta_description: metaDescription,
    })
  }

  const handleTranslationChange = (locale: string, field: 'title' | 'content', value: string) => {
    setArticle({
      ...article,
      translations: article.translations.map(t =>
        t.locale === locale ? { ...t, [field]: value } : t
      ),
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, create a data URL (in production, upload to cloud storage)
    const reader = new FileReader()
    reader.onload = (event) => {
      setArticle({
        ...article,
        featured_image: event.target?.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!article.title || !article.content) {
      toast({
        title: 'Error',
        description: 'Please fill in title and content',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        slug: article.slug,
        title: article.title,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        content: article.content,
        featured_image: article.featured_image,
        featured: article.featured,
        published: article.published,
        meta_description: article.meta_description,
        reading_time_minutes: article.reading_time_minutes,
      }

      let response
      if (article.id) {
        response = await fetch(`/api/articles/${article.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save article')
      }

      toast({
        title: 'Success',
        description: article.id ? 'Article updated' : 'Article created',
      })

      // Redirect after successful save
      setTimeout(() => {
        router.push(`/${locale}/admin/articles`)
      }, 1500)
    } catch (error) {
      console.error('[v0] Save error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save article',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p>Loading article...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {article.id ? 'Edit Article' : 'Create New Article'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Main Information</h3>

          <div>
            <Label htmlFor="title">Article Title *</Label>
            <Input
              id="title"
              value={article.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter article title"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="repair, phone, instructions"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="featured_image">Featured Image</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="featured_image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {article.featured_image && (
                <img
                  src={article.featured_image}
                  alt="featured"
                  className="w-20 h-20 object-cover rounded"
                />
              )}
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={article.featured}
                onChange={(e) => setArticle({ ...article, featured: e.target.checked })}
              />
              <span>Featured Article</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={article.published}
                onChange={(e) => setArticle({ ...article, published: e.target.checked })}
              />
              <span>Published</span>
            </label>
          </div>
        </div>

        {/* Content Editor */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Content</h3>
          <div className="border rounded-lg">
            {editorReady ? (
              <ReactQuill
                value={article.content}
                onChange={handleContentChange}
                theme="snow"
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'header': 1 }, { 'header': 2 }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['link', 'image'],
                  ],
                }}
                placeholder="Write article content here..."
              />
            ) : (
              <Textarea
                value={article.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write article content here..."
                className="min-h-64"
              />
            )}
          </div>
          <p className="text-sm text-gray-600">
            Reading time: ~{article.reading_time_minutes} minutes
          </p>
        </div>

        {/* Meta Information */}
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg">Meta Information (Auto-generated)</h3>
          <div>
            <Label>Slug</Label>
            <Input value={article.slug} readOnly className="mt-1 bg-gray-100" />
          </div>
          <div>
            <Label>Meta Description</Label>
            <Textarea
              value={article.meta_description}
              readOnly
              className="mt-1 bg-gray-100 min-h-20"
            />
          </div>
        </div>

        {/* Translations (Optional) */}
        {article.translations.length > 1 && (
          <Tabs defaultValue={article.translations[0].locale} className="space-y-4">
            <TabsList>
              {article.translations.map((trans) => (
                <TabsTrigger key={trans.locale} value={trans.locale}>
                  {LOCALES.find(l => l.code === trans.locale)?.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {article.translations.map((trans) => (
              <TabsContent key={trans.locale} value={trans.locale} className="space-y-4">
                <div>
                  <Label>Title ({LOCALES.find(l => l.code === trans.locale)?.name})</Label>
                  <Input
                    value={trans.title}
                    onChange={(e) => handleTranslationChange(trans.locale, 'title', e.target.value)}
                    placeholder="Article title in this language"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Content ({LOCALES.find(l => l.code === trans.locale)?.name})</Label>
                  <Textarea
                    value={trans.content}
                    onChange={(e) => handleTranslationChange(trans.locale, 'content', e.target.value)}
                    placeholder="Article content in this language"
                    className="min-h-64"
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-6 border-t">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : article.id ? 'Update Article' : 'Create Article'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
