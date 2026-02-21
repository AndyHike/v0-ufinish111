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
import { Save, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react'

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

  // Main article data - shared across all languages
  const [mainData, setMainData] = useState({
    title: '',
    tags: [] as string[],
    featured_image: '',
    featured: false,
    published: false,
  })

  const [tagInput, setTagInput] = useState('')

  // Language-specific translations
  const [translations, setTranslations] = useState<ArticleTranslation[]>(
    LOCALES.map(loc => ({
      locale: loc.code,
      title: '',
      content: '',
    }))
  )

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
      setMainData({
        title: data.title || '',
        tags: data.tags || [],
        featured_image: data.featured_image || '',
        featured: data.featured || false,
        published: data.published || false,
      })
      setTagInput((data.tags || []).join(', '))

      const articleTranslations = data.article_translations || []
      setTranslations(
        LOCALES.map(loc => {
          const trans = articleTranslations.find((t: any) => t.locale === loc.code)
          return {
            locale: loc.code,
            title: trans?.title || '',
            content: trans?.content || '',
          }
        })
      )
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

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !mainData.tags.includes(trimmed)) {
      setMainData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmed],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setMainData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const handleTranslationChange = (locale: string, field: 'title' | 'content', value: string) => {
    setTranslations(prev =>
      prev.map(t =>
        t.locale === locale ? { ...t, [field]: value } : t
      )
    )
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(false)

    // Validation
    if (!mainData.title.trim()) {
      setError('Please enter article title')
      return
    }

    const mainTranslation = translations.find(t => t.locale === locale)
    if (!mainTranslation?.title || !mainTranslation?.content) {
      setError(`Please fill title and content for ${locale}`)
      return
    }

    setIsSaving(true)
    try {
      const slug = generateSlug(mainData.title)
      const readingTime = generateReadingTime(mainTranslation.content)
      const metaDescription = generateMetaDescription(mainTranslation.content)

      const payload = {
        slug,
        title: mainData.title,
        content: mainTranslation.content,
        featured_image: mainData.featured_image,
        featured: mainData.featured,
        published: mainData.published,
        tags: mainData.tags,
        reading_time_minutes: readingTime,
        meta_description: metaDescription,
        translations: translations.map(t => ({
          locale: t.locale,
          title: t.title || mainData.title,
          content: t.content || mainTranslation.content,
        })),
      }

      const url = articleId ? `/api/articles/${articleId}` : '/api/articles'
      const method = articleId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save article')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/admin/articles`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">Article saved successfully!</p>
        </div>
      )}

      {/* Main Section - Basic Info */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Basic Information</h2>

        <div>
          <Label htmlFor="title">Article Title *</Label>
          <Input
            id="title"
            value={mainData.title}
            onChange={e => setMainData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter article title"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Slug will be auto-generated: {generateSlug(mainData.title)}
          </p>
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="tags"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag(tagInput)
                }
              }}
              placeholder="Type tag and press Enter"
            />
            <Button
              type="button"
              onClick={() => handleAddTag(tagInput)}
              variant="outline"
            >
              Add
            </Button>
          </div>
          {mainData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {mainData.tags.map(tag => (
                <div key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="image">Featured Image URL</Label>
          <Input
            id="image"
            value={mainData.featured_image}
            onChange={e => setMainData(prev => ({ ...prev, featured_image: e.target.value }))}
            placeholder="https://example.com/image.jpg"
            className="mt-1"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mainData.featured}
              onChange={e => setMainData(prev => ({ ...prev, featured: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">Featured Article</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mainData.published}
              onChange={e => setMainData(prev => ({ ...prev, published: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm">Published</span>
          </label>
        </div>
      </div>

      {/* Language-Specific Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          {LOCALES.map(loc => (
            <TabsTrigger key={loc.code} value={loc.code}>
              {loc.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {LOCALES.map(loc => {
          const trans = translations.find(t => t.locale === loc.code)
          return (
            <TabsContent key={loc.code} value={loc.code} className="space-y-4 mt-4">
              <div>
                <Label htmlFor={`title-${loc.code}`}>
                  Title ({loc.name}) {loc.code === locale ? '*' : ''}
                </Label>
                <Input
                  id={`title-${loc.code}`}
                  value={trans?.title || ''}
                  onChange={e => handleTranslationChange(loc.code, 'title', e.target.value)}
                  placeholder={`Title in ${loc.name}`}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`content-${loc.code}`}>
                  Content ({loc.name}) {loc.code === locale ? '*' : ''}
                </Label>
                <Textarea
                  id={`content-${loc.code}`}
                  value={trans?.content || ''}
                  onChange={e => handleTranslationChange(loc.code, 'content', e.target.value)}
                  placeholder={`Write article content in ${loc.name}...`}
                  className="mt-1 min-h-64 font-mono text-sm"
                />
                {trans?.content && (
                  <p className="text-xs text-gray-500 mt-1">
                    Reading time: ~{generateReadingTime(trans.content)} min
                  </p>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Actions */}
      <div className="flex gap-4 justify-end pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {articleId ? 'Update' : 'Create'} Article
        </Button>
      </div>
    </div>
  )
}
